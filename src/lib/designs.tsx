/* eslint-disable @next/next/no-img-element */
import { Member } from "./types";
import { getBirthDate } from "./utils";

export interface DesignProps {
  member: Member;
  message: string;
  churchLogoUrl?: string;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatEditorialName(member: Member): string {
  const titlePrefix = (member.title || "").trim();
  const rawFullName = `${member.first_name || ""} ${member.middle_name || ""} ${member.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();
  const namesTitleCased = toTitleCase(rawFullName);
  return titlePrefix ? `${titlePrefix} ${namesTitleCased}` : namesTitleCased;
}

function splitEditorialName(member: Member): { givenLine: string; surnameLine: string } {
  const titlePrefix = (member.title || "").trim();
  const firstMid = [member.first_name, member.middle_name]
    .map((n) => (n || "").trim())
    .filter(Boolean)
    .map(toTitleCase)
    .join(" ");
  const givenLine = [titlePrefix, firstMid].filter(Boolean).join(" ");
  const surnameLine = toTitleCase((member.last_name || "").trim());
  if (!surnameLine) {
    return { givenLine: "", surnameLine: givenLine || "Celebrant" };
  }
  return { givenLine, surnameLine };
}

function getNameFontSize(name: string, baseSize = 46): number {
  if (name.length <= 16) return baseSize;
  return Math.max(34, Math.min(baseSize, Math.round(baseSize * (16 / name.length) * 1.12)));
}

function getDepartmentText(member: Member): string {
  const primaryUnit = member.units?.[0];
  if (!primaryUnit) return "";
  const role = primaryUnit.role;
  const name = primaryUnit.name || "";

  const formattedName = toTitleCase(name);
  const unitSuffix =
    formattedName.toLowerCase().includes("unit") ||
    formattedName.toLowerCase().includes("department") ||
    formattedName.toLowerCase().includes("committee") ||
    formattedName.toLowerCase().includes("team") ||
    formattedName.toLowerCase().includes("choir") ||
    formattedName.toLowerCase().includes("partner") ||
    formattedName.toLowerCase().includes("minister")
      ? ""
      : " Department";
  const displayName = `${formattedName}${unitSuffix}`;

  if (role === "head") {
    return `HOD - ${displayName}`;
  } else if (role === "assistant") {
    return `Assistant - ${displayName}`;
  } else {
    return displayName;
  }
}

function shouldShowPositionBadge(member: Member): boolean {
  const posText = (member.position || "").trim();
  if (!posText) return false;

  const deptText = getDepartmentText(member).trim();
  if (!deptText) return true;

  const normPos = posText.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normDept = deptText.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normPos === normDept || normDept.includes(normPos) || normPos.includes(normDept)) {
    return false;
  }

  return true;
}

function getPrimaryRoleText(member: Member): string {
  return getDepartmentText(member) || (member.position || "").trim();
}

const PositionBadge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <div
    style={{
      display: "flex",
      padding: "6px 18px",
      backgroundColor: bg,
      color: color,
      borderRadius: 4,
      fontFamily: "Montserrat",
      fontSize: 16,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "3px",
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// 8 DISTINCT ARCHITECTURAL TEMPLATES (All Powered by Cinzel + Montserrat)
// ---------------------------------------------------------------------------

export const designs: Array<{
  name: string;
  render: (props: DesignProps) => React.ReactElement;
}> = [
  // =========================================================================
  // 1. Classic Alabaster — Signature 50/50 Light Gallery Split
  // =========================================================================
  {
    name: "Classic Alabaster",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const deptText = getDepartmentText(member);
      const showPos = shouldShowPositionBadge(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#f3f3f3",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "50%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 80,
              paddingRight: 40,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 40 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={90} style={{ objectFit: "contain" }} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 18,
                fontWeight: 700,
                color: "#c5a86a",
                letterSpacing: 5,
                marginBottom: 12,
              }}
            >
              {getBirthDate(member).toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Cinzel",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 700, color: "#c5a86a", letterSpacing: 4, lineHeight: 1 }}>
                HAPPY
              </span>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: "#c5a86a",
                  letterSpacing: 6,
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                BIRTHDAY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(fullName, 46),
                fontWeight: 700,
                color: "#1e2022",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {fullName}
            </div>

            {deptText && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Montserrat",
                  fontSize: 18,
                  color: "#c5a86a",
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: showPos ? 12 : 20,
                }}
              >
                {deptText}
              </div>
            )}

            {showPos && (
              <div style={{ display: "flex", marginBottom: 20 }}>
                <PositionBadge text={member.position!} bg="#eae3d2" color="#a3874b" />
              </div>
            )}

            <div
              style={{
                display: "flex",
                width: 120,
                height: 2,
                background: "#c5a86a",
                marginBottom: 24,
              }}
            />

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 26,
                lineHeight: 1.6,
                color: "#4b5563",
              }}
            >
              {message}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "50%",
              justifyContent: "center",
              alignItems: "center",
              paddingRight: 60,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 440,
                height: 640,
                border: "8px solid #ffffff",
                boxShadow: "0 15px 35px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{ width: 440, height: 640, objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", width: "100%", height: "100%", background: "#eae7e2" }} />
              )}
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 2. Obsidian Gold — Signature 50/50 Dark Gallery Split
  // =========================================================================
  {
    name: "Obsidian Gold",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const deptText = getDepartmentText(member);
      const showPos = shouldShowPositionBadge(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#0b0d17",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "50%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 80,
              paddingRight: 40,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 40 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={90} style={{ objectFit: "contain" }} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 18,
                fontWeight: 700,
                color: "#c5a86a",
                letterSpacing: 5,
                marginBottom: 12,
              }}
            >
              {getBirthDate(member).toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Cinzel",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 700, color: "#c5a86a", letterSpacing: 4, lineHeight: 1 }}>
                HAPPY
              </span>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: "#c5a86a",
                  letterSpacing: 6,
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                BIRTHDAY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(fullName, 46),
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {fullName}
            </div>

            {deptText && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Montserrat",
                  fontSize: 18,
                  color: "#c5a86a",
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: showPos ? 12 : 20,
                }}
              >
                {deptText}
              </div>
            )}

            {showPos && (
              <div style={{ display: "flex", marginBottom: 20 }}>
                <PositionBadge text={member.position!} bg="#1e1e24" color="#c5a86a" />
              </div>
            )}

            <div
              style={{
                display: "flex",
                width: 120,
                height: 2,
                background: "#c5a86a",
                marginBottom: 24,
              }}
            />

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 26,
                lineHeight: 1.6,
                color: "#9ca3af",
              }}
            >
              {message}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "50%",
              justifyContent: "center",
              alignItems: "center",
              paddingRight: 60,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 440,
                height: 640,
                border: "8px solid #ffffff",
                boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{ width: 440, height: 640, objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", width: "100%", height: "100%", background: "#1e1e24" }} />
              )}
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 3. Emerald Prestige — Two-Tone Architectural Pillar & Editorial Quote Block
  // =========================================================================
  {
    name: "Emerald Prestige",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#09221b",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Full-Height Left Architectural Pillar */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: 310,
              height: 1080,
              background: "#10352a",
              borderRight: "2px solid #d4b46e",
            }}
          />

          {/* Left Portrait Overlapping the Architectural Seam */}
          <div
            style={{
              display: "flex",
              width: "48%",
              justifyContent: "center",
              alignItems: "center",
              paddingLeft: 40,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: 10,
                border: "2px solid #d4b46e",
                background: "#09221b",
                boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 410,
                  height: 620,
                  border: "6px solid #ffffff",
                  overflow: "hidden",
                  background: "#10352a",
                }}
              >
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt="Member"
                    style={{ width: 410, height: 620, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", background: "#10352a" }} />
                )}
              </div>
            </div>
          </div>

          {/* Right Editorial Column */}
          <div
            style={{
              display: "flex",
              width: "52%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 36,
              paddingRight: 76,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 36 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={84} style={{ objectFit: "contain" }} />
              </div>
            )}

            {/* Flanking Line Date Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", width: 44, height: 2, background: "#d4b46e", marginRight: 14 }} />
              <span
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#d4b46e",
                  letterSpacing: 5,
                }}
              >
                {getBirthDate(member).toUpperCase()}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: 34,
                fontWeight: 700,
                color: "#d4b46e",
                letterSpacing: 5,
                marginBottom: 12,
              }}
            >
              HAPPY BIRTHDAY
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(fullName, 48),
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.18,
                marginBottom: 18,
              }}
            >
              {fullName}
            </div>

            {primaryRole && (
              <div style={{ display: "flex", marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    padding: "8px 20px",
                    background: "#10352a",
                    border: "1px solid #d4b46e",
                    color: "#d4b46e",
                    fontFamily: "Montserrat",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {primaryRole}
                </div>
              </div>
            )}

            {/* Left-Bordered Editorial Quote Block for Prayer */}
            <div
              style={{
                display: "flex",
                borderLeft: "4px solid #d4b46e",
                paddingLeft: 24,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 25,
                  lineHeight: 1.6,
                  color: "#d1fae5",
                }}
              >
                {message}
              </span>
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 4. Royal Sapphire — Inset Architectural Border & Two-Tier Name Lockup
  // =========================================================================
  {
    name: "Royal Sapphire",
    render: ({ member, message, churchLogoUrl }) => {
      const { givenLine, surnameLine } = splitEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1080,
            height: 1080,
            background: "#0a1526",
            padding: 36,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inset Double-Line Architectural Frame */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              border: "2px solid #c5a86a",
              padding: 44,
              justifyContent: "space-between",
            }}
          >
            {/* Top Header Strip */}
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(197,168,106,0.3)",
                paddingBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {churchLogoUrl ? (
                  <img src={churchLogoUrl} alt="Church Logo" height={72} style={{ objectFit: "contain" }} />
                ) : (
                  <span
                    style={{
                      fontFamily: "Cinzel",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#c5a86a",
                      letterSpacing: 4,
                    }}
                  >
                    BIRTHDAY CELEBRATION
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  padding: "8px 22px",
                  border: "1px solid #c5a86a",
                  fontFamily: "Montserrat",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#c5a86a",
                  letterSpacing: 4,
                }}
              >
                {getBirthDate(member).toUpperCase()}
              </div>
            </div>

            {/* Center Body */}
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              {/* Left Portrait */}
              <div
                style={{
                  display: "flex",
                  width: 390,
                  height: 550,
                  border: "8px solid #ffffff",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
                  overflow: "hidden",
                  background: "#13233f",
                }}
              >
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt="Member"
                    style={{ width: 390, height: 550, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", background: "#13233f" }} />
                )}
              </div>

              {/* Right Stacked Typography */}
              <div
                style={{
                  display: "flex",
                  width: 480,
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Montserrat",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#c5a86a",
                    letterSpacing: 6,
                    marginBottom: 18,
                  }}
                >
                  HAPPY BIRTHDAY
                </div>

                {givenLine && (
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "Montserrat",
                      fontSize: 26,
                      fontWeight: 400,
                      color: "#e2e8f0",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    {givenLine}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    fontFamily: "Cinzel",
                    fontSize: getNameFontSize(surnameLine, 54),
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: 16,
                  }}
                >
                  {surnameLine}
                </div>

                {primaryRole && (
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "Montserrat",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#c5a86a",
                      letterSpacing: 4,
                      textTransform: "uppercase",
                      marginBottom: 22,
                    }}
                  >
                    {primaryRole}
                  </div>
                )}

                {/* Ornamental Diamond Rule */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                  <div style={{ display: "flex", width: 70, height: 2, background: "#c5a86a" }} />
                  <div
                    style={{
                      display: "flex",
                      width: 8,
                      height: 8,
                      background: "#c5a86a",
                      marginLeft: 10,
                      marginRight: 10,
                    }}
                  />
                  <div style={{ display: "flex", width: 70, height: 2, background: "#c5a86a" }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    fontFamily: "Montserrat",
                    fontSize: 24,
                    lineHeight: 1.6,
                    color: "#cbd5e1",
                  }}
                >
                  {message}
                </div>
              </div>
            </div>

            {/* Bottom Subtle Footer Rule */}
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                borderTop: "1px solid rgba(197,168,106,0.3)",
                paddingTop: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#c5a86a",
                  letterSpacing: 6,
                }}
              >
                GOD BLESS YOUR NEW AGE
              </span>
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 5. Ivory Luxury — Warm Two-Tone Sandstone Backdrop & Framed Prayer Card
  // =========================================================================
  {
    name: "Ivory Luxury",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#faf7f2",
            border: "18px solid #b89753",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Right Sandstone Architectural Backdrop */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              right: 0,
              width: 390,
              height: 1080,
              background: "#ede5d5",
              borderLeft: "2px solid #b89753",
            }}
          />

          {/* Left Editorial Column */}
          <div
            style={{
              display: "flex",
              width: "54%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 68,
              paddingRight: 36,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 34 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={82} style={{ objectFit: "contain" }} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 17,
                fontWeight: 700,
                color: "#9c7c38",
                letterSpacing: 5,
                marginBottom: 10,
              }}
            >
              CELEBRATING YOU • {getBirthDate(member).toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: 42,
                fontWeight: 700,
                color: "#b89753",
                letterSpacing: 4,
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              HAPPY BIRTHDAY
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(fullName, 46),
                fontWeight: 700,
                color: "#1e1b18",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {fullName}
            </div>

            {primaryRole && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Montserrat",
                  fontSize: 17,
                  color: "#9c7c38",
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 24,
                }}
              >
                {primaryRole}
              </div>
            )}

            {/* Framed Editorial Callout Card for Prayer */}
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                border: "1px solid #dfd3bc",
                borderLeft: "4px solid #b89753",
                padding: "24px 28px",
                boxShadow: "0 10px 25px rgba(184,151,83,0.08)",
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 24,
                  lineHeight: 1.6,
                  color: "#3f3a34",
                }}
              >
                {message}
              </span>
            </div>
          </div>

          {/* Right Double-Matted Portrait */}
          <div
            style={{
              display: "flex",
              width: "46%",
              justifyContent: "center",
              alignItems: "center",
              paddingRight: 44,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: 10,
                background: "#faf7f2",
                border: "2px solid #b89753",
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 400,
                  height: 610,
                  border: "8px solid #ffffff",
                  overflow: "hidden",
                  background: "#e5dec9",
                }}
              >
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt="Member"
                    style={{ width: 400, height: 610, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", background: "#e5dec9" }} />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 6. Amethyst Royal — Floor-Anchored Cathedral Arch Portrait
  // =========================================================================
  {
    name: "Amethyst Royal",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#140921",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Gold Ribbon Bar */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: 1080,
              height: 12,
              background: "#dfb968",
            }}
          />

          {/* Left Editorial Stack */}
          <div
            style={{
              display: "flex",
              width: "52%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 80,
              paddingRight: 30,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 38 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={88} style={{ objectFit: "contain" }} />
              </div>
            )}

            {/* Gold Pill Date Badge */}
            <div style={{ display: "flex", marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  padding: "7px 20px",
                  borderRadius: 30,
                  background: "#24113b",
                  border: "1px solid #dfb968",
                  fontFamily: "Montserrat",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#dfb968",
                  letterSpacing: 4,
                }}
              >
                {getBirthDate(member).toUpperCase()}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Cinzel",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 46, fontWeight: 700, color: "#dfb968", letterSpacing: 4, lineHeight: 1 }}>
                HAPPY
              </span>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: "#dfb968",
                  letterSpacing: 6,
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                BIRTHDAY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(fullName, 46),
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: 14,
              }}
            >
              {fullName}
            </div>

            {primaryRole && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Montserrat",
                  fontSize: 18,
                  color: "#dfb968",
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 22,
                }}
              >
                {primaryRole}
              </div>
            )}

            <div
              style={{
                display: "flex",
                width: 120,
                height: 2,
                background: "#dfb968",
                marginBottom: 24,
              }}
            />

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 25,
                lineHeight: 1.6,
                color: "#d8cfe3",
              }}
            >
              {message}
            </div>
          </div>

          {/* Right Floor-Anchored Cathedral Arch Portrait */}
          <div
            style={{
              display: "flex",
              width: "48%",
              height: "100%",
              justifyContent: "center",
              alignItems: "flex-end",
              paddingRight: 50,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                width: 440,
                height: 820,
              }}
            >
              {/* Offset Gold Arch Wireframe */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: -18,
                  left: -18,
                  width: 440,
                  height: 838,
                  borderRadius: "220px 220px 0 0",
                  border: "2px solid #dfb968",
                }}
              />
              <div
                style={{
                  display: "flex",
                  width: 440,
                  height: 820,
                  borderRadius: "220px 220px 0 0",
                  borderTop: "8px solid #ffffff",
                  borderLeft: "8px solid #ffffff",
                  borderRight: "8px solid #ffffff",
                  overflow: "hidden",
                  background: "#24113b",
                  boxShadow: "0 -10px 40px rgba(0,0,0,0.4)",
                }}
              >
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt="Member"
                    style={{
                      width: 440,
                      height: 820,
                      borderRadius: "212px 212px 0 0",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", background: "#24113b" }} />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 7. Sunset Bronze — Offset Double-Frame Portrait with Floating Date Plaque
  // =========================================================================
  {
    name: "Sunset Bronze",
    render: ({ member, message, churchLogoUrl }) => {
      const { givenLine, surnameLine } = splitEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "radial-gradient(circle at center, #2b1712 0%, #140a08 100%)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Left Portrait with Offset Frame & Floating Bottom Date Plaque */}
          <div
            style={{
              display: "flex",
              width: "46%",
              justifyContent: "center",
              alignItems: "center",
              paddingLeft: 40,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                width: 410,
                height: 630,
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: 18,
                  left: 18,
                  width: 410,
                  height: 630,
                  border: "2px solid #d9b372",
                  borderRadius: 12,
                }}
              />
              <div
                style={{
                  display: "flex",
                  width: 410,
                  height: 630,
                  borderRadius: 12,
                  border: "8px solid #ffffff",
                  overflow: "hidden",
                  background: "#2b1712",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt="Member"
                    style={{ width: 410, height: 630, borderRadius: 6, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", background: "#2b1712" }} />
                )}
              </div>

              {/* Floating Date Plaque Overlapping Portrait Bottom */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  bottom: -22,
                  left: 65,
                  width: 280,
                  height: 48,
                  background: "#d9b372",
                  color: "#140a08",
                  borderRadius: 6,
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: "Montserrat",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: 4,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                }}
              >
                {getBirthDate(member).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Right Editorial Stack */}
          <div
            style={{
              display: "flex",
              width: "54%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 40,
              paddingRight: 76,
              zIndex: 10,
            }}
          >
            {churchLogoUrl && (
              <div style={{ display: "flex", marginBottom: 38 }}>
                <img src={churchLogoUrl} alt="Church Logo" height={86} style={{ objectFit: "contain" }} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 18,
                fontWeight: 700,
                color: "#d9b372",
                letterSpacing: 6,
                marginBottom: 16,
              }}
            >
              HAPPY BIRTHDAY
            </div>

            {givenLine && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Cinzel",
                  fontSize: 30,
                  fontWeight: 400,
                  color: "#f5ebe6",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {givenLine}
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontFamily: "Cinzel",
                fontSize: getNameFontSize(surnameLine, 54),
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {surnameLine}
            </div>

            {primaryRole && (
              <div style={{ display: "flex", marginBottom: 24 }}>
                <PositionBadge text={primaryRole} bg="#2b1712" color="#d9b372" />
              </div>
            )}

            <div
              style={{
                display: "flex",
                width: 110,
                height: 2,
                background: "#d9b372",
                marginBottom: 24,
              }}
            />

            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 25,
                lineHeight: 1.6,
                color: "#dfd5d0",
              }}
            >
              {message}
            </div>
          </div>
        </div>
      );
    },
  },

  // =========================================================================
  // 8. Crimson Velvet — Regal Medallion Crest & Centered Serif Typography
  // =========================================================================
  {
    name: "Crimson Velvet",
    render: ({ member, message, churchLogoUrl }) => {
      const fullName = formatEditorialName(member);
      const primaryRole = getPrimaryRoleText(member);

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1080,
            height: 1080,
            background: "#260810",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "16px solid #c5a86a",
            paddingLeft: 100,
            paddingRight: 100,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 22 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={74} style={{ objectFit: "contain" }} />
            </div>
          )}

          {/* Outer Gold Ring + Circular Gallery Medallion Portrait */}
          <div
            style={{
              display: "flex",
              padding: 10,
              borderRadius: 190,
              border: "2px solid #dfb968",
              marginBottom: 26,
            }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt="Member"
                style={{
                  width: 330,
                  height: 330,
                  borderRadius: 165,
                  border: "8px solid #ffffff",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.35)",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 330,
                  height: 330,
                  borderRadius: 165,
                  border: "8px solid #ffffff",
                  background: "#3d0f1b",
                }}
              />
            )}
          </div>

          {/* Flanked Date Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", width: 50, height: 1, background: "#dfb968", marginRight: 16 }} />
            <span
              style={{
                fontFamily: "Montserrat",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: 6,
                color: "#dfb968",
              }}
            >
              HAPPY BIRTHDAY • {getBirthDate(member).toUpperCase()}
            </span>
            <div style={{ display: "flex", width: 50, height: 1, background: "#dfb968", marginLeft: 16 }} />
          </div>

          {/* Celebrant Name in Cinzel */}
          <div
            style={{
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              fontFamily: "Cinzel",
              fontSize: getNameFontSize(fullName, 48),
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: 12,
            }}
          >
            {fullName}
          </div>

          {/* Primary Role / Department Pill */}
          {primaryRole && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
              <PositionBadge text={primaryRole} bg="#3d0f1b" color="#dfb968" />
            </div>
          )}

          {/* Prayer / Greeting Copy */}
          <div
            style={{
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              fontFamily: "Montserrat",
              fontSize: 25,
              lineHeight: 1.6,
              color: "#e5e7eb",
            }}
          >
            {message}
          </div>
        </div>
      );
    },
  },
];

export const defaultMessages = [
  "May the Lord continue to bless you and keep you. May His face shine upon you and give you peace throughout this new year.",
];
