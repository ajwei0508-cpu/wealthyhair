import os
import json
import sqlite3
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "admin_audit.db")
KST = timezone(timedelta(hours=9))

_GEO_CACHE: Dict[str, Dict[str, Any]] = {}


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_admin_db():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_members (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                birth_date TEXT,
                age INTEGER,
                gender TEXT,
                auto_login INTEGER DEFAULT 1,
                consents_json TEXT,
                created_at TEXT,
                last_login_at TEXT,
                last_active_at TEXT,
                last_ip TEXT,
                last_location_label TEXT,
                last_region TEXT,
                last_city TEXT,
                last_lat REAL,
                last_lng REAL,
                last_isp TEXT,
                last_device_summary TEXT,
                is_demo INTEGER DEFAULT 0
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_usage_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                kst_time_str TEXT,
                session_id TEXT,
                member_id TEXT,
                member_name TEXT,
                member_email TEXT,
                member_phone TEXT,
                member_gender TEXT,
                member_age TEXT,
                is_member INTEGER DEFAULT 0,
                event_type TEXT,
                event_label TEXT,
                app_section TEXT,
                action_detail TEXT,
                metadata_json TEXT,
                ip_address TEXT,
                country TEXT,
                region TEXT,
                city TEXT,
                district TEXT,
                location_label TEXT,
                latitude REAL,
                longitude REAL,
                isp TEXT,
                location_source TEXT,
                device_type TEXT,
                device_model TEXT,
                os_name TEXT,
                browser_name TEXT,
                screen_resolution TEXT,
                network_type TEXT,
                referrer TEXT,
                user_agent TEXT,
                duration_sec INTEGER DEFAULT 0,
                is_demo INTEGER DEFAULT 0
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON admin_usage_logs(timestamp DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_logs_member ON admin_usage_logs(member_id)")
        conn.commit()
    finally:
        conn.close()


init_admin_db()


def _upsert_member_row(cur, m: Dict[str, Any]):
    if not m or not (m.get("id") or m.get("email")):
        return
    member_id = str(m.get("id") or f"email_{str(m.get('email')).lower()}")
    email = str(m.get("email") or "").lower()
    name = str(m.get("name") or (email.split("@")[0] if email else "회원"))
    phone = str(m.get("phone") or "")
    birth_date = str(m.get("birthDate") or m.get("birth_date") or "")
    age = m.get("age")
    try:
        age = int(age) if age is not None and str(age).strip() != "" else None
    except Exception:
        age = None
    gender = str(m.get("gender") or "male")
    auto_login = 0 if m.get("autoLogin") is False or m.get("auto_login") == 0 else 1
    consents_raw = m.get("consents") or m.get("consents_json") or {}
    consents_json = consents_raw if isinstance(consents_raw, str) else json.dumps(consents_raw, ensure_ascii=False)
    created_at = str(m.get("createdAt") or m.get("created_at") or datetime.now(KST).isoformat())
    last_login_at = str(m.get("lastLoginAt") or m.get("last_login_at") or created_at)
    last_active_at = str(m.get("lastActiveAt") or m.get("last_active_at") or last_login_at)
    last_ip = str(m.get("lastIp") or m.get("last_ip") or "")
    last_location_label = str(m.get("lastLocationLabel") or m.get("last_location_label") or "")
    last_region = str(m.get("lastRegion") or m.get("last_region") or "")
    last_city = str(m.get("lastCity") or m.get("last_city") or "")
    last_lat = m.get("lastLat") if m.get("lastLat") is not None else m.get("last_lat")
    last_lng = m.get("lastLng") if m.get("lastLng") is not None else m.get("last_lng")
    last_isp = str(m.get("lastIsp") or m.get("last_isp") or "")
    last_device_summary = str(m.get("lastDeviceSummary") or m.get("last_device_summary") or "")
    is_demo = 1 if m.get("isDemo") or m.get("is_demo") else 0

    cur.execute("SELECT * FROM admin_members WHERE id = ? OR (email != '' AND email = ?)", (member_id, email))
    existing = cur.fetchone()
    if existing:
        target_id = existing["id"]
        cur.execute(
            """
            UPDATE admin_members SET
                name = COALESCE(NULLIF(?, ''), name),
                email = COALESCE(NULLIF(?, ''), email),
                phone = COALESCE(NULLIF(?, ''), phone),
                birth_date = COALESCE(NULLIF(?, ''), birth_date),
                age = COALESCE(?, age),
                gender = COALESCE(NULLIF(?, ''), gender),
                auto_login = ?,
                consents_json = CASE WHEN ? != '{}' THEN ? ELSE consents_json END,
                last_login_at = CASE WHEN ? > COALESCE(last_login_at, '') THEN ? ELSE last_login_at END,
                last_active_at = CASE WHEN ? > COALESCE(last_active_at, '') THEN ? ELSE last_active_at END,
                last_ip = CASE WHEN ? != '' THEN ? ELSE last_ip END,
                last_location_label = CASE WHEN ? != '' THEN ? ELSE last_location_label END,
                last_region = CASE WHEN ? != '' THEN ? ELSE last_region END,
                last_city = CASE WHEN ? != '' THEN ? ELSE last_city END,
                last_lat = COALESCE(?, last_lat),
                last_lng = COALESCE(?, last_lng),
                last_isp = CASE WHEN ? != '' THEN ? ELSE last_isp END,
                last_device_summary = CASE WHEN ? != '' THEN ? ELSE last_device_summary END
            WHERE id = ?
            """,
            (
                name,
                email,
                phone,
                birth_date,
                age,
                gender,
                auto_login,
                consents_json,
                consents_json,
                last_login_at,
                last_login_at,
                last_active_at,
                last_active_at,
                last_ip,
                last_ip,
                last_location_label,
                last_location_label,
                last_region,
                last_region,
                last_city,
                last_city,
                last_lat,
                last_lng,
                last_isp,
                last_isp,
                last_device_summary,
                last_device_summary,
                target_id,
            ),
        )
    else:
        cur.execute(
            """
            INSERT INTO admin_members (
                id, name, email, phone, birth_date, age, gender, auto_login,
                consents_json, created_at, last_login_at, last_active_at,
                last_ip, last_location_label, last_region, last_city,
                last_lat, last_lng, last_isp, last_device_summary, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                member_id,
                name,
                email,
                phone,
                birth_date,
                age,
                gender,
                auto_login,
                consents_json,
                created_at,
                last_login_at,
                last_active_at,
                last_ip,
                last_location_label,
                last_region,
                last_city,
                last_lat,
                last_lng,
                last_isp,
                last_device_summary,
                is_demo,
            ),
        )


def _upsert_log_row(cur, log: Dict[str, Any]):
    if not log or not log.get("id"):
        return
    log_id = str(log.get("id"))
    timestamp = str(log.get("timestamp") or datetime.now(KST).isoformat())
    kst_time_str = str(log.get("kstTimeStr") or log.get("kst_time_str") or "")
    session_id = str(log.get("sessionId") or log.get("session_id") or "")
    member_id = str(log.get("memberId") or log.get("member_id") or "guest")
    member_name = str(log.get("memberName") or log.get("member_name") or "비회원(방문자)")
    member_email = str(log.get("memberEmail") or log.get("member_email") or "")
    member_phone = str(log.get("memberPhone") or log.get("member_phone") or "")
    member_gender = str(log.get("memberGender") or log.get("member_gender") or "")
    member_age = str(log.get("memberAge") or log.get("member_age") or "")
    is_member = 1 if log.get("isMember") or log.get("is_member") or (member_id and member_id != "guest") else 0
    event_type = str(log.get("eventType") or log.get("event_type") or "PAGE_VIEW")
    event_label = str(log.get("eventLabel") or log.get("event_label") or "")
    app_section = str(log.get("appSection") or log.get("app_section") or "")
    action_detail = str(log.get("actionDetail") or log.get("action_detail") or "")
    meta_raw = log.get("metadata") or log.get("metadata_json") or {}
    metadata_json = meta_raw if isinstance(meta_raw, str) else json.dumps(meta_raw, ensure_ascii=False)
    ip_address = str(log.get("ipAddress") or log.get("ip_address") or "")
    country = str(log.get("country") or "대한민국")
    region = str(log.get("region") or "")
    city = str(log.get("city") or "")
    district = str(log.get("district") or "")
    location_label = str(log.get("locationLabel") or log.get("location_label") or "")
    latitude = log.get("latitude")
    longitude = log.get("longitude")
    isp = str(log.get("isp") or "")
    location_source = str(log.get("locationSource") or log.get("location_source") or "IP 네트워크")
    device_type = str(log.get("deviceType") or log.get("device_type") or "")
    device_model = str(log.get("deviceModel") or log.get("device_model") or "")
    os_name = str(log.get("osName") or log.get("os_name") or "")
    browser_name = str(log.get("browserName") or log.get("browser_name") or "")
    screen_resolution = str(log.get("screenResolution") or log.get("screen_resolution") or "")
    network_type = str(log.get("networkType") or log.get("network_type") or "")
    referrer = str(log.get("referrer") or "")
    user_agent = str(log.get("userAgent") or log.get("user_agent") or "")
    duration_sec = int(log.get("durationSec") or log.get("duration_sec") or 0)
    is_demo = 1 if log.get("isDemo") or log.get("is_demo") else 0

    cur.execute(
        """
        INSERT OR REPLACE INTO admin_usage_logs (
            id, timestamp, kst_time_str, session_id,
            member_id, member_name, member_email, member_phone, member_gender, member_age, is_member,
            event_type, event_label, app_section, action_detail, metadata_json,
            ip_address, country, region, city, district, location_label,
            latitude, longitude, isp, location_source,
            device_type, device_model, os_name, browser_name, screen_resolution,
            network_type, referrer, user_agent, duration_sec, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            log_id,
            timestamp,
            kst_time_str,
            session_id,
            member_id,
            member_name,
            member_email,
            member_phone,
            member_gender,
            member_age,
            is_member,
            event_type,
            event_label,
            app_section,
            action_detail,
            metadata_json,
            ip_address,
            country,
            region,
            city,
            district,
            location_label,
            latitude,
            longitude,
            isp,
            location_source,
            device_type,
            device_model,
            os_name,
            browser_name,
            screen_resolution,
            network_type,
            referrer,
            user_agent,
            duration_sec,
            is_demo,
        ),
    )

    if is_member and member_id != "guest":
        dev_summary = f"{device_model or device_type} · {os_name} · {browser_name}".strip(" ·")
        _upsert_member_row(
            cur,
            {
                "id": member_id,
                "name": member_name,
                "email": member_email,
                "phone": member_phone,
                "gender": member_gender,
                "age": member_age,
                "lastActiveAt": timestamp,
                "lastIp": ip_address,
                "lastLocationLabel": location_label,
                "lastRegion": region,
                "lastCity": city,
                "lastLat": latitude,
                "lastLng": longitude,
                "lastIsp": isp,
                "lastDeviceSummary": dev_summary,
                "isDemo": is_demo,
            },
        )


@router.get("/geoip")
async def resolve_client_geoip(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.headers.get("x-real-ip") or (request.client.host if request.client else "127.0.0.1"))
    )
    is_local = client_ip in ("127.0.0.1", "::1", "localhost") or client_ip.startswith("192.168.") or client_ip.startswith("10.")
    cache_key = "SELF_PUBLIC" if is_local else client_ip

    if cache_key in _GEO_CACHE:
        return {"success": True, "data": _GEO_CACHE[cache_key]}

    # Query ip-api.com with Korean localization
    target_url = (
        "http://ip-api.com/json/?fields=status,country,regionName,city,district,lat,lon,isp,org,query&lang=ko"
        if is_local
        else f"http://ip-api.com/json/{client_ip}?fields=status,country,regionName,city,district,lat,lon,isp,org,query&lang=ko"
    )
    try:
        req = urllib.request.Request(target_url, headers={"User-Agent": "WealthyHairAdmin/1.0"})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
            if raw.get("status") == "success":
                lat = raw.get("lat") or 37.5665
                lon = raw.get("lon") or 126.9780
                country = raw.get("country") or "대한민국"
                if country.lower() in ("south korea", "korea", "republic of korea"):
                    country = "대한민국"
                region = raw.get("regionName") or "서울특별시"
                city = raw.get("city") or ""
                district = raw.get("district") or ""

                # 한국어 시·도 / 시·군·구 / 읍·면·동 역지오코딩 보강
                try:
                    bdc_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=ko"
                    bdc_req = urllib.request.Request(bdc_url, headers={"User-Agent": "WealthyHairAdmin/1.0"})
                    with urllib.request.urlopen(bdc_req, timeout=2.2) as bdc_resp:
                        bdc = json.loads(bdc_resp.read().decode("utf-8"))
                        if bdc.get("countryName"):
                            country = bdc["countryName"]
                        if bdc.get("principalSubdivision"):
                            region = bdc["principalSubdivision"]
                        admin_list = (bdc.get("localityInfo") or {}).get("administrative") or []
                        gu_gun = next((a["name"] for a in admin_list if a.get("adminLevel") == 6 and a.get("name")), "")
                        dong_item = bdc.get("locality") or next(
                            (a["name"] for a in reversed(admin_list) if a.get("adminLevel", 0) >= 7 and a.get("name")),
                            "",
                        )
                        if gu_gun:
                            city = gu_gun
                        elif bdc.get("city") and bdc.get("city") != region:
                            city = bdc["city"]
                        if dong_item and dong_item not in (region, city):
                            district = dong_item
                except Exception:
                    pass

                parts = [p for p in [region, city, district] if p]
                cleaned_parts = []
                for p in parts:
                    if not any(p == existing for existing in cleaned_parts):
                        cleaned_parts.append(p)
                loc_label = " ".join(cleaned_parts) if cleaned_parts else f"{country} {region}"
                geo_data = {
                    "ipAddress": raw.get("query") or client_ip,
                    "country": country,
                    "region": region,
                    "city": city,
                    "district": district,
                    "locationLabel": loc_label,
                    "latitude": lat,
                    "longitude": lon,
                    "isp": raw.get("isp") or raw.get("org") or "국내 통신망",
                    "locationSource": "공인 IP + 한국어 행정구역",
                }
                _GEO_CACHE[cache_key] = geo_data
                return {"success": True, "data": geo_data}
    except Exception:
        pass

    fallback = {
        "ipAddress": client_ip,
        "country": "대한민국",
        "region": "서울특별시",
        "city": "강남구",
        "district": "",
        "locationLabel": "서울특별시 강남구 (로컬 네트워크)",
        "latitude": 37.4979,
        "longitude": 127.0276,
        "isp": "Local / Broadband",
        "locationSource": "로컬 게이트웨이",
    }
    return {"success": True, "data": fallback}


class TrackPayload(BaseModel):
    log: Optional[Dict[str, Any]] = None
    member: Optional[Dict[str, Any]] = None


@router.post("/track")
async def track_event(payload: TrackPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        if payload.member:
            _upsert_member_row(cur, payload.member)
        if payload.log:
            _upsert_log_row(cur, payload.log)
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


class SyncPayload(BaseModel):
    members: Optional[List[Dict[str, Any]]] = None
    logs: Optional[List[Dict[str, Any]]] = None


def _fetch_all_admin_data(conn):
    cur = conn.cursor()
    cur.execute("SELECT * FROM admin_members ORDER BY COALESCE(last_active_at, created_at) DESC")
    member_rows = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM admin_usage_logs ORDER BY timestamp DESC LIMIT 800")
    log_rows = [dict(r) for r in cur.fetchall()]

    members_out = []
    for m in member_rows:
        try:
            consents = json.loads(m.get("consents_json") or "{}")
        except Exception:
            consents = {}
        members_out.append(
            {
                "id": m["id"],
                "name": m["name"],
                "email": m["email"],
                "phone": m["phone"],
                "birthDate": m["birth_date"],
                "age": m["age"],
                "gender": m["gender"],
                "autoLogin": bool(m["auto_login"]),
                "consents": consents,
                "createdAt": m["created_at"],
                "lastLoginAt": m["last_login_at"],
                "lastActiveAt": m["last_active_at"],
                "lastIp": m["last_ip"],
                "lastLocationLabel": m["last_location_label"],
                "lastRegion": m["last_region"],
                "lastCity": m["last_city"],
                "lastLat": m["last_lat"],
                "lastLng": m["last_lng"],
                "lastIsp": m["last_isp"],
                "lastDeviceSummary": m["last_device_summary"],
                "isDemo": bool(m["is_demo"]),
            }
        )

    logs_out = []
    for l in log_rows:
        try:
            meta = json.loads(l.get("metadata_json") or "{}")
        except Exception:
            meta = {}
        logs_out.append(
            {
                "id": l["id"],
                "timestamp": l["timestamp"],
                "kstTimeStr": l["kst_time_str"],
                "sessionId": l["session_id"],
                "memberId": l["member_id"],
                "memberName": l["member_name"],
                "memberEmail": l["member_email"],
                "memberPhone": l["member_phone"],
                "memberGender": l["member_gender"],
                "memberAge": l["member_age"],
                "isMember": bool(l["is_member"]),
                "eventType": l["event_type"],
                "eventLabel": l["event_label"],
                "appSection": l["app_section"],
                "actionDetail": l["action_detail"],
                "metadata": meta,
                "ipAddress": l["ip_address"],
                "country": l["country"],
                "region": l["region"],
                "city": l["city"],
                "district": l["district"],
                "locationLabel": l["location_label"],
                "latitude": l["latitude"],
                "longitude": l["longitude"],
                "isp": l["isp"],
                "locationSource": l["location_source"],
                "deviceType": l["device_type"],
                "deviceModel": l["device_model"],
                "osName": l["os_name"],
                "browserName": l["browser_name"],
                "screenResolution": l["screen_resolution"],
                "networkType": l["network_type"],
                "referrer": l["referrer"],
                "userAgent": l["user_agent"],
                "durationSec": l["duration_sec"],
                "isDemo": bool(l["is_demo"]),
            }
        )

    return {"members": members_out, "logs": logs_out}


@router.post("/sync")
async def sync_admin_data(payload: SyncPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        for m in payload.members or []:
            _upsert_member_row(cur, m)
        for l in payload.logs or []:
            _upsert_log_row(cur, l)
        conn.commit()
        data = _fetch_all_admin_data(conn)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


@router.get("/overview")
async def get_admin_overview():
    conn = get_db_connection()
    try:
        data = _fetch_all_admin_data(conn)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


class ManageActionPayload(BaseModel):
    action: str  # 'clear_demo' | 'clear_all_logs' | 'delete_log' | 'delete_member'
    targetId: Optional[str] = None


@router.post("/manage")
async def manage_admin_records(payload: ManageActionPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        if payload.action == "clear_demo":
            cur.execute("DELETE FROM admin_usage_logs WHERE is_demo = 1")
            cur.execute("DELETE FROM admin_members WHERE is_demo = 1")
        elif payload.action == "clear_all_logs":
            cur.execute("DELETE FROM admin_usage_logs")
        elif payload.action == "delete_log" and payload.targetId:
            cur.execute("DELETE FROM admin_usage_logs WHERE id = ?", (payload.targetId,))
        elif payload.action == "delete_member" and payload.targetId:
            cur.execute("DELETE FROM admin_members WHERE id = ?", (payload.targetId,))
            cur.execute("DELETE FROM admin_usage_logs WHERE member_id = ?", (payload.targetId,))
        conn.commit()
        data = _fetch_all_admin_data(conn)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()
