#!/usr/bin/env python3
"""Copy the GrupoLyN template and push Apps Script without printing credentials."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE_ID = "1DmWspcWSL1YCqj2PlEOdrbKYMyvpieZKrKParZi1doM"
FOLDER_NAME = "GrupoLyN Technical Assessment v2.4"
SHEET_NAME = "DSM PROSPR Plan v2.4 (GrupoLyN Admin)"
ROOT = Path(__file__).resolve().parents[1]
APPS = ROOT / "apps-script"
STATE = ROOT / ".drive-state.json"


def token() -> str:
    env = os.environ.copy()
    env["CLOUDSDK_CORE_DISABLE_PROMPTS"] = "1"
    out = subprocess.check_output(
        ["gcloud", "auth", "print-access-token"],
        env=env,
        stderr=subprocess.DEVNULL,
    )
    return out.decode().strip()


def req(method: str, url: str, tok: str, payload: dict | None = None, raw: bool = False):
    data = None
    headers = {"Authorization": "Bearer " + tok, "Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            body = resp.read()
            if raw:
                return resp.status, body
            return resp.status, json.loads(body.decode() or "{}")
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {err.code} {method} {url.split('?')[0]}: {detail[:1500]}") from err


def find_or_create_folder(tok: str) -> str:
    q = (
        "name = 'GrupoLyN Technical Assessment v2.4' and "
        "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    status, body = req(
        "GET",
        "https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name)&q="
        + urllib.parse.quote(q),
        tok,
    )
    files = body.get("files") or []
    if files:
        return files[0]["id"]
    _, created = req(
        "POST",
        "https://www.googleapis.com/drive/v3/files",
        tok,
        {
            "name": FOLDER_NAME,
            "mimeType": "application/vnd.google-apps.folder",
        },
    )
    return created["id"]


def copy_spreadsheet(tok: str, folder_id: str) -> str:
    _, copied = req(
        "POST",
        f"https://www.googleapis.com/drive/v3/files/{SOURCE_ID}/copy",
        tok,
        {"name": SHEET_NAME, "parents": [folder_id]},
    )
    return copied["id"]


def find_bound_script(tok: str, spreadsheet_id: str) -> str | None:
    q = f"'{spreadsheet_id}' in parents and mimeType = 'application/vnd.google-apps.script' and trashed = false"
    _, body = req(
        "GET",
        "https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=" + urllib.parse.quote(q),
        tok,
    )
    files = body.get("files") or []
    return files[0]["id"] if files else None


def create_bound_script(tok: str, spreadsheet_id: str) -> str:
    try:
        _, body = req(
            "POST",
            "https://script.googleapis.com/v1/projects",
            tok,
            {"title": "GrupoLyN Admin v2.4", "parentId": spreadsheet_id},
        )
        return body["scriptId"]
    except RuntimeError as err:
        if "insufficient" not in str(err).lower() and "403" not in str(err):
            raise
        return create_bound_script_via_drive_(tok, spreadsheet_id)


def create_bound_script_via_drive_(tok: str, spreadsheet_id: str) -> str:
    _, created = req(
        "POST",
        "https://www.googleapis.com/drive/v3/files",
        tok,
        {
            "name": "GrupoLyN Admin v2.4",
            "mimeType": "application/vnd.google-apps.script",
            "parents": [spreadsheet_id],
        },
    )
    script_id = created["id"]
    payload = {
        "files": [
            {
                "id": f["name"],
                "name": f["name"],
                "type": "json" if f["type"] == "JSON" else "server_js",
                "source": f["source"],
            }
            for f in gs_files()
        ]
    }
    data = json.dumps(payload).encode()
    request = urllib.request.Request(
        f"https://www.googleapis.com/upload/drive/v3/files/{script_id}?uploadType=media",
        data=data,
        headers={
            "Authorization": "Bearer " + tok,
            "Content-Type": "application/vnd.google-apps.script+json",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(request) as resp:
            json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise RuntimeError(f"Drive script upload failed HTTP {err.code}: {detail[:1500]}") from err
    return script_id


def gs_files() -> list[dict]:
    files = []
    for path in sorted(APPS.rglob("*")):
        if not path.is_file():
            continue
        if path.name == "appsscript.json":
            files.append({"name": "appsscript", "type": "JSON", "source": path.read_text()})
            continue
        if path.suffix == ".gs":
            files.append({"name": path.stem, "type": "SERVER_JS", "source": path.read_text()})
    return files


def merge_onopen(existing_files: list[dict]) -> None:
    for file in existing_files:
        if file.get("type") != "SERVER_JS":
            continue
        src = file.get("source") or ""
        if "function onOpen(" in src and "function _legacyOnOpen(" not in src:
            file["source"] = src.replace("function onOpen(", "function _legacyOnOpen(", 1)


def update_cover(tok: str, spreadsheet_id: str) -> None:
    _, meta = req(
        "GET",
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=sheets.properties",
        tok,
    )
    cover_id = None
    for sheet in meta.get("sheets") or []:
        props = sheet.get("properties") or {}
        if props.get("title") == "Cover":
            cover_id = props.get("sheetId")
            break
    _, data = req(
        "GET",
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/Cover",
        tok,
    )
    values = data.get("values") or []
    for r, row in enumerate(values):
        for c, cell in enumerate(row):
            if "Version 2.3" in str(cell):
                a1 = _a1(r, c)
                req(
                    "PUT",
                    f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote('Cover!' + a1)}?valueInputOption=USER_ENTERED",
                    tok,
                    {"values": [[str(cell).replace("Version 2.3", "Version 2.4")]]},
                )


def _a1(row0: int, col0: int) -> str:
    n = col0 + 1
    letters = ""
    while n:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return f"{letters}{row0 + 1}"


def put_script(tok: str, script_id: str, files: list[dict]) -> None:
    req(
        "PUT",
        f"https://script.googleapis.com/v1/projects/{script_id}/content",
        tok,
        {"files": files},
    )


def main() -> int:
    tok = token()
    if STATE.exists():
        saved = json.loads(STATE.read_text())
        folder_id = saved.get("folderId") or find_or_create_folder(tok)
        spreadsheet_id = saved.get("spreadsheetId")
        if not spreadsheet_id:
            spreadsheet_id = copy_spreadsheet(tok, folder_id)
        print(f"Drive folder id: {folder_id}")
        print(f"Spreadsheet id: {spreadsheet_id}")
        print(f"URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")
    else:
        folder_id = find_or_create_folder(tok)
        print(f"Drive folder id: {folder_id}")
        spreadsheet_id = copy_spreadsheet(tok, folder_id)
        print(f"Spreadsheet id: {spreadsheet_id}")
        print(f"URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")
    try:
        update_cover(tok, spreadsheet_id)
        print("Cover stamped to Version 2.4")
    except Exception as err:
        print(f"Cover update skipped: {err}")

    our = gs_files()
    our_names = {f["name"] for f in our}
    script_id = find_bound_script(tok, spreadsheet_id)
    files = []
    if script_id:
        print(f"Existing bound script: {script_id}")
        try:
            _, content = req(
                "GET",
                f"https://script.googleapis.com/v1/projects/{script_id}/content",
                tok,
            )
            files = content.get("files") or []
            merge_onopen(files)
            files = [f for f in files if f.get("name") not in our_names]
            files.extend(our)
            jsons = [f for f in files if f.get("name") == "appsscript"]
            others = [f for f in files if f.get("name") != "appsscript"]
            if jsons:
                files = others + [jsons[-1]]
            put_script(tok, script_id, files)
            print(f"Script pushed via Apps Script API: {script_id}")
        except RuntimeError as err:
            print(f"Apps Script API unavailable, using Drive upload: {str(err)[:180]}")
            script_id = create_bound_script_via_drive_(tok, spreadsheet_id)
            print(f"Script uploaded via Drive: {script_id}")
    else:
        print("Creating bound Apps Script project…")
        script_id = create_bound_script(tok, spreadsheet_id)
        print(f"Script created: {script_id}")
        try:
            put_script(tok, script_id, our)
            print("Content pushed via Apps Script API")
        except RuntimeError:
            print("Content already attached via Drive upload fallback")
    STATE.write_text(
        json.dumps(
            {
                "folderId": folder_id,
                "spreadsheetId": spreadsheet_id,
                "scriptId": script_id,
                "spreadsheetUrl": f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit",
            },
            indent=2,
        )
        + "\n"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
