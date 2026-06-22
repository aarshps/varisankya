#!/usr/bin/env python3
"""Set the Google Play store-listing icon (512) via the AndroidPublisher edits API.

Non-interactive store-icon update with the same publisher service account that
uploads bundles (see the hora-play-store skill). The launcher mipmaps are a
separate asset — this only touches the listing graphic. Uploads to every
listing locale, validates, commits, then verifies the served bytes.

Usage (from android/):  python tools/set_play_store_icon.py
"""
import hashlib
import os
import sys
import urllib.request

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PKG = "com.hora.varisankya"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # android/
KEY = os.path.join(HERE, "app", "play_console_key.json")
ICON = os.path.join(HERE, "play_icon_512.png")
SCOPE = ["https://www.googleapis.com/auth/androidpublisher"]


def main():
    src = open(ICON, "rb").read()
    src_sha = hashlib.sha256(src).hexdigest()
    creds = service_account.Credentials.from_service_account_file(KEY, scopes=SCOPE)
    svc = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)

    eid = svc.edits().insert(packageName=PKG, body={}).execute()["id"]
    listings = svc.edits().listings().list(packageName=PKG, editId=eid).execute().get("listings", [])
    locales = [l["language"] for l in listings] or ["en-US"]
    print(f"edit {eid}; listing locales: {locales}")

    for loc in locales:
        svc.edits().images().upload(
            packageName=PKG, editId=eid, language=loc, imageType="icon",
            media_body=MediaFileUpload(ICON, mimetype="image/png"),
        ).execute()
        print(f"  uploaded icon for {loc}")

    svc.edits().validate(packageName=PKG, editId=eid).execute()
    svc.edits().commit(packageName=PKG, editId=eid).execute()
    print("committed (live).")

    # Verify on a fresh edit: served bytes should match the source.
    veid = svc.edits().insert(packageName=PKG, body={}).execute()["id"]
    imgs = svc.edits().images().list(
        packageName=PKG, editId=veid, language=locales[0], imageType="icon",
    ).execute().get("images", [])
    if not imgs:
        print("verify: WARNING no icon returned"); return
    served = urllib.request.urlopen(imgs[0]["url"]).read()
    ok = hashlib.sha256(served).hexdigest() == src_sha
    print(f"verify: served icon {'matches' if ok else 'DOES NOT MATCH'} source (src sha256 {src_sha[:12]}…)")
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
