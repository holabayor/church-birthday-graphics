/* eslint-disable @next/next/no-img-element */
import { Member } from "./types";
import { getFullName, getBirthDate } from "./utils";

export interface DesignProps {
  member: Member;
  message: string;
  churchLogoUrl?: string;
}

function getNameFontSize(name: string, baseSize: number): number {
  if (name.length <= 12) return baseSize;
  return Math.max(40, Math.min(baseSize, Math.round(baseSize * (12 / name.length) * 1.15)));
}

function getDepartmentText(member: Member): string {
  const primaryUnit = member.units?.[0];
  if (!primaryUnit) return "";
  const role = primaryUnit.role;
  const name = primaryUnit.name;
  const unitSuffix = name.toLowerCase().includes("unit") || name.toLowerCase().includes("department") || name.toLowerCase().includes("committee") ? "" : " Department";
  const displayName = `${name}${unitSuffix}`;
  
  if (role === "head") {
    return `HOD - ${displayName}`;
  } else if (role === "assistant") {
    return `Assistant - ${displayName}`;
  } else {
    return displayName;
  }
}

function getDesignFullName(member: Member): string {
  const last = (member.last_name || "").trim().toUpperCase();
  const firstAndMiddle = [member.first_name, member.middle_name].map(n => (n || "").trim()).filter(Boolean).join(" ");
  if (!last) return firstAndMiddle;
  if (!firstAndMiddle) return last;
  return `${last}, ${firstAndMiddle}`.trim();
}

// ---------------------------------------------------------------------------
// HELPER COMPONENTS
// ---------------------------------------------------------------------------

// A flexible background pattern component
const DotPattern = ({ color = "rgba(255,255,255,0.1)" }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(${color} 2px, transparent 2px)`,
      backgroundSize: "30px 30px",
    }}
  />
);

// A simple badge for the position
const PositionBadge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <div
    style={{
      display: "flex",
      padding: "8px 24px",
      backgroundColor: bg,
      color: color,
      borderRadius: 4,
      fontSize: 24,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "2px",
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// DESIGNS
// ---------------------------------------------------------------------------

export const designs: Array<{
  name: string;
  render: (props: DesignProps) => React.ReactElement;
}> = [
  {
    name: "Midnight Gold",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#0f1117",
          overflow: "hidden",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background Text */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -70,
            left: -40,
            fontSize: 360,
            color: "#1b1d24",
            fontWeight: 900,
            lineHeight: 0.8,
          }}
        >
          HBD
        </div>

        {/* Left */}
        <div
          style={{
            display: "flex",
            width: "54%",
            flexDirection: "column",
            justifyContent: "center",
            padding: 80,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 45 }}>
              <img src={churchLogoUrl} alt="" height={100} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              color: "#d4af37",
              letterSpacing: 5,
              fontSize: 22,
              marginBottom: 20,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 82),
              color: "white",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28 }}>
              <PositionBadge text={member.position} bg="#1b1d24" color="#d4af37" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 130,
              height: 5,
              background: "#d4af37",
              marginBottom: getDepartmentText(member) ? 22 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#d4af37",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 22,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              color: "#c8c8c8",
              fontSize: 28,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#d4af37",
                color: "#0f1117",
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            display: "flex",
            width: "46%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 430,
              height: 660,
              overflow: "hidden",
              border: "4px solid #d4af37",
            }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: "#333",
                }}
              />
            )}
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Emerald Prestige",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#0f2d24",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent Shape */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: 300,
            background: "#164536",
            right: -180,
            top: -180,
          }}
        />

        {/* Left */}
        <div
          style={{
            display: "flex",
            width: "50%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 430,
              height: 640,
              borderRadius: 30,
              overflow: "hidden",
              border: "5px solid #d4af37",
            }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: "#333",
                }}
              />
            )}
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            display: "flex",
            width: "50%",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 80,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 45 }}>
              <img src={churchLogoUrl} alt="" height={100} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              color: "#d4af37",
              letterSpacing: 6,
              fontSize: 22,
              marginBottom: 20,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 78),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 30,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 30 }}>
              <PositionBadge text={member.position} bg="#164536" color="#d4af37" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 120,
              height: 5,
              background: "#d4af37",
              marginBottom: getDepartmentText(member) ? 22 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#d4af37",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 22,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              color: "#d1d5db",
              fontSize: 28,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#d4af37",
                color: "#0f2d24",
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: "Crimson Velvet",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 1080,
          background: "#310a14",
          fontFamily: "sans-serif",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Top Gold Bar */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 18,
            background: "#d4af37",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 60,
            paddingLeft: 80,
            paddingRight: 80,
            zIndex: 10,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 35 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={90} style={{ objectFit: "contain" }} />
            </div>
          )}

          {/* Satori Fix: Applied styles directly to the img tag */}
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt="Member"
              style={{
                width: 400,
                height: 400,
                borderRadius: 200,
                border: "8px solid #d4af37",
                objectFit: "cover",
                marginBottom: 40,
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 400,
                height: 400,
                borderRadius: 200,
                border: "8px solid #d4af37",
                background: "#4a1220",
                marginBottom: 40,
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 5,
              color: "#e8b943",
              marginBottom: 20,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: getNameFontSize(getDesignFullName(member), 76),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28, justifyContent: "center" }}>
              <PositionBadge text={member.position} bg="#4a1220" color="#e8b943" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 120,
              height: 5,
              background: "#d4af37",
              marginBottom: getDepartmentText(member) ? 22 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
                fontSize: 25,
                color: "#e8b943",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 22,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              textAlign: "center",
              fontSize: 28,
              lineHeight: 1.7,
              color: "#e5e7eb",
              marginBottom: 36,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#d4af37",
                color: "#310a14",
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Royal Sapphire",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#0a192f",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <DotPattern color="rgba(56, 189, 248, 0.05)" />

        {/* Photo Left */}
        <div
          style={{
            display: "flex",
            width: "48%",
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 20,
          }}
        >
          {/* Satori Fix: Applied styles directly to the img tag */}
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt="Member"
              style={{
                width: 440,
                height: 680,
                borderRadius: 30,
                border: "6px solid #38bdf8",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 440,
                height: 680,
                borderRadius: 30,
                border: "6px solid #38bdf8",
                background: "#112240",
              }}
            />
          )}
        </div>

        {/* Text Right */}
        <div
          style={{
            display: "flex",
            width: "52%",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 80,
            paddingLeft: 30,
            zIndex: 10,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 50 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={100} style={{ objectFit: "contain" }} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#38bdf8",
              letterSpacing: 5,
              marginBottom: 22,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 80),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 30,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 30 }}>
              <PositionBadge text={member.position} bg="#112240" color="#38bdf8" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 120,
              height: 5,
              background: "#38bdf8",
              marginBottom: getDepartmentText(member) ? 22 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#38bdf8",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 22,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 29,
              lineHeight: 1.7,
              color: "#cbd5e1",
              marginBottom: 40,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#38bdf8",
                color: "#0a192f",
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Amethyst Night",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#1a0b2e",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative Ambient Shapes */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: 400,
            background: "#2d1b4e",
            top: -300,
            right: -200,
            opacity: 0.8,
          }}
        />

        {/* Text Left */}
        <div
          style={{
            display: "flex",
            width: "56%",
            flexDirection: "column",
            justifyContent: "center",
            padding: 80,
            zIndex: 10,
          }}
        >
          {churchLogoUrl && (
            <div style={{ display: "flex", marginBottom: 50 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={110} style={{ objectFit: "contain" }} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 6,
              color: "#fbbf24",
              marginBottom: 24,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 78),
              fontWeight: 800,
              lineHeight: 1,
              color: "white",
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28 }}>
              <PositionBadge text={member.position} bg="#3b1b54" color="#fbbf24" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 120,
              height: 5,
              background: "#fbbf24",
              marginBottom: getDepartmentText(member) ? 22 : 36,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#fbbf24",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 22,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 29,
              lineHeight: 1.6,
              color: "#d1d5db",
              marginBottom: 36,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#fbbf24",
                color: "#1a0b2e",
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>

        {/* Arch Photo Right */}
        <div
          style={{
            display: "flex",
            width: "44%",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Satori Fix: Applied styles directly to the img tag */}
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt="Member"
              style={{
                width: 420,
                height: 640,
                borderRadius: "210px 210px 20px 20px",
                border: "6px solid #fbbf24",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 420,
                height: 640,
                borderRadius: "210px 210px 20px 20px",
                border: "6px solid #fbbf24",
                background: "#3b1b54",
              }}
            />
          )}
        </div>
      </div>
    ),
  },

  {
    name: "Sunset Minimalist",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#2d141b",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: 350,
            background: "radial-gradient(circle, rgba(226,186,115,0.06) 0%, transparent 70%)",
            left: -150,
            bottom: -150,
          }}
        />

        <div
          style={{
            display: "flex",
            width: "46%",
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 420,
              height: 660,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                width: 420,
                height: 660,
                border: "3px solid #e2ba73",
                borderRadius: 16,
              }}
            />
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: 0,
                left: 0,
                width: 420,
                height: 660,
                borderRadius: 16,
                overflow: "hidden",
                border: "4px solid #ffffff",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    background: "#3c1b24",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "54%",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 60,
            paddingRight: 80,
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
              fontSize: 20,
              color: "#e2ba73",
              letterSpacing: 6,
              marginBottom: 16,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 80),
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: member.position ? 18 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28 }}>
              <PositionBadge text={member.position} bg="#3c1b24" color="#e2ba73" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 100,
              height: 4,
              background: "#e2ba73",
              marginBottom: getDepartmentText(member) ? 20 : 30,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#e2ba73",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.6,
              color: "#dcd2d4",
              marginBottom: 36,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#e2ba73",
                color: "#2d141b",
                borderRadius: 8,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Glow Cyber",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#070913",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: 300,
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            right: -100,
            top: -100,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: 250,
            background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
            left: -100,
            bottom: -100,
          }}
        />

        <div
          style={{
            display: "flex",
            width: "56%",
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
              fontSize: 20,
              color: "#06b6d4",
              letterSpacing: 6,
              marginBottom: 16,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 80),
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: member.position ? 18 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28 }}>
              <PositionBadge text={member.position} bg="#161329" color="#a78bfa" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 100,
              height: 4,
              background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
              marginBottom: getDepartmentText(member) ? 20 : 30,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#06b6d4",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.6,
              color: "#9ca3af",
              marginBottom: 36,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                color: "#ffffff",
                borderRadius: 8,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "44%",
            justifyContent: "center",
            alignItems: "center",
            paddingRight: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 420,
              height: 640,
              borderRadius: 30,
              overflow: "hidden",
              border: "4px solid #8b5cf6",
            }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt="Member"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: "#161329",
                }}
              />
            )}
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Ivory Luxury",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#fcfbfa",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
          border: "24px solid #b89753",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "46%",
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 400,
              height: 620,
              borderRadius: 4,
              overflow: "hidden",
              border: "6px double #b89753",
            }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt="Member"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: "#eae7e2",
                }}
              />
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "54%",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 60,
            paddingRight: 60,
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
              fontSize: 20,
              color: "#b89753",
              letterSpacing: 6,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              display: "flex",
              fontSize: getNameFontSize(getDesignFullName(member), 80),
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#1e2022",
              marginBottom: member.position ? 18 : 28,
            }}
          >
            {getDesignFullName(member)}
          </div>

          {member.position && (
            <div style={{ display: "flex", marginBottom: 28 }}>
              <PositionBadge text={member.position} bg="#f5efdf" color="#b89753" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              width: 100,
              height: 4,
              background: "#b89753",
              marginBottom: getDepartmentText(member) ? 20 : 30,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#b89753",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.6,
              color: "#4a4a4a",
              marginBottom: 36,
            }}
          >
            {message}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 32px",
                background: "#b89753",
                color: "#fcfbfa",
                borderRadius: 4,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              {getBirthDate(member)}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Triptych Teal",
    render: ({ member, message, churchLogoUrl }) => {
      const dob = new Date(member.date_of_birth);
      const day = dob.getDate();
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const month = monthNames[dob.getMonth()] || "FEB";
      
      const nth = (d: number) => {
        if (d > 3 && d < 21) return "TH";
        switch (d % 10) {
          case 1:  return "ST";
          case 2:  return "ND";
          case 3:  return "RD";
          default: return "TH";
        }
      };

      return (
        <div
          style={{
            display: "flex",
            width: 1080,
            height: 1080,
            background: "#ffffff",
            overflow: "hidden",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "56%",
              height: "100%",
              background: "#f0f2f5",
              display: "flex",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 580,
              height: 580,
              borderRadius: 290,
              background: "#e4e7eb",
              left: 30,
              top: 150,
              display: "flex",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 50,
              height: 50,
              borderRadius: 25,
              background: "radial-gradient(circle, #06b6d4 0%, #0891b2 100%)",
              left: 60,
              top: 60,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 24,
              height: 24,
              borderRadius: 12,
              background: "#facc15",
              left: 120,
              top: 120,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "56%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 40,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                width: 440,
                height: 680,
                borderRadius: "220px 220px 0 0",
                overflow: "hidden",
                border: "4px solid #ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    background: "#0891b2",
                  }}
                />
              )}

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 130,
                  height: "100%",
                  background: "linear-gradient(to bottom, rgba(6,182,212,0.4), rgba(8,145,178,0.75))",
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  width: 130,
                  height: "100%",
                  background: "linear-gradient(to bottom, rgba(6,182,212,0.4), rgba(8,145,178,0.75))",
                  display: "flex",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 130,
                  top: 0,
                  width: 14,
                  height: "100%",
                  background: "#ffffff",
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 296,
                  top: 0,
                  width: 14,
                  height: "100%",
                  background: "#ffffff",
                  display: "flex",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 40,
                  width: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#ffffff",
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{day}{nth(day)}</span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, marginTop: 4 }}>{month}</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: getNameFontSize(getDesignFullName(member), 42),
                fontWeight: 900,
                color: "#111827",
                marginTop: 35,
                textAlign: "center",
              }}
            >
              {getDesignFullName(member)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "44%",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 60,
              paddingRight: 60,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
              <svg width="150" height="180" viewBox="0 0 180 240" fill="none" style={{ display: "flex" }}>
                <ellipse cx="60" cy="80" rx="30" ry="40" fill="#3b82f6" opacity="0.85" />
                <path d="M60 120 L80 190" stroke="#94a3b8" strokeWidth="2" />
                <ellipse cx="120" cy="80" rx="30" ry="40" fill="#22d3ee" opacity="0.85" />
                <path d="M120 120 L100 190" stroke="#94a3b8" strokeWidth="2" />
                <ellipse cx="90" cy="70" rx="32" ry="42" fill="#06b6d4" />
                <path d="M90 112 L90 195" stroke="#64748b" strokeWidth="2" />
                <polygon points="60,120 57,125 63,125" fill="#2563eb" />
                <polygon points="120,120 117,125 123,125" fill="#0891b2" />
                <polygon points="90,112 87,117 93,117" fill="#0891b2" />
              </svg>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                width: "100%",
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 300, color: "#1f2937", lineHeight: 1.1 }}>Happy</span>
              <span style={{ fontSize: 62, fontWeight: 900, color: "#111827", letterSpacing: 2, lineHeight: 1 }}>BIRTHDAY</span>
              {member.position && (
                <span style={{ fontSize: 44, fontWeight: 800, color: "#0891b2", textTransform: "uppercase", marginTop: 4 }}>
                  {member.position}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                width: 100,
                height: 4,
                background: "#06b6d4",
                alignSelf: "center",
                marginTop: 25,
                marginBottom: getDepartmentText(member) ? 16 : 25,
              }}
            />

            {getDepartmentText(member) && (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#0891b2",
                  fontWeight: 600,
                  fontStyle: "italic",
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              >
                {getDepartmentText(member)}
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontSize: 26,
                lineHeight: 1.6,
                color: "#4b5563",
                textAlign: "center",
              }}
            >
              {message}
            </div>

            <div
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderRadius: 10,
                background: "#facc15",
                right: 140,
                bottom: 80,
                display: "flex",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "radial-gradient(circle, #06b6d4 0%, #0891b2 100%)",
                right: 60,
                bottom: 40,
                display: "flex",
              }}
            />
          </div>
        </div>
      );
    }
  },

  {
    name: "Classic Alabaster",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#f3f4f6",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 30, bottom: 30, display: "flex" }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: "flex", opacity: 0.25 }}>
            <circle cx="6" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="54" r="2.5" fill="#1f2937" />
          </svg>
        </div>
        <div style={{ position: "absolute", right: 30, bottom: 30, display: "flex" }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: "flex", opacity: 0.25 }}>
            <circle cx="6" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="6" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="22" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="38" r="2.5" fill="#1f2937" />
            <circle cx="6" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="22" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="38" cy="54" r="2.5" fill="#1f2937" />
            <circle cx="54" cy="54" r="2.5" fill="#1f2937" />
          </svg>
        </div>

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
            <div style={{ display: "flex", marginBottom: 50 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={90} style={{ objectFit: "contain" }} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 40,
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 300, fontStyle: "italic", color: "#1f2937", lineHeight: 1 }}>happy</span>
            <span style={{ fontSize: 64, fontWeight: 900, color: "#c5a86a", letterSpacing: 3, lineHeight: 1.1, marginTop: 4 }}>BIRTHDAY</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginBottom: 35 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#c5a86a", lineHeight: 0.5, marginBottom: 10 }}>“</span>
            <span style={{ fontSize: 26, lineHeight: 1.6, color: "#4b5563" }}>{message}</span>
          </div>

          <div
            style={{
              display: "flex",
              width: 240,
              height: 4,
              background: "#c5a86a",
              marginBottom: getDepartmentText(member) ? 20 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#c5a86a",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#1f2937" }}>
              Born: {getBirthDate(member)}
            </span>
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
              position: "relative",
              width: 440,
              height: 640,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 440,
                height: 640,
                border: "8px solid #ffffff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    background: "#eae7e2",
                  }}
                />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: -20,
                bottom: 40,
                width: 420,
                background: "#c5a86a",
                display: "flex",
                flexDirection: "column",
                padding: "16px 24px",
                boxShadow: "5px 5px 15px rgba(0,0,0,0.15)",
              }}
            >
              <span
                style={{
                  fontSize: getNameFontSize(getDesignFullName(member), 26),
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {getDesignFullName(member)}
              </span>
              {member.position && (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f3f4f6",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    marginTop: 4,
                  }}
                >
                  {member.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    name: "Obsidian Gold",
    render: ({ member, message, churchLogoUrl }) => (
      <div
        style={{
          display: "flex",
          width: 1080,
          height: 1080,
          background: "#0b0d17",
          overflow: "hidden",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 30, bottom: 30, display: "flex" }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: "flex", opacity: 0.15 }}>
            <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="54" r="2.5" fill="#ffffff" />
          </svg>
        </div>
        <div style={{ position: "absolute", right: 30, bottom: 30, display: "flex" }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ display: "flex", opacity: 0.15 }}>
            <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="6" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="22" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="6" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="22" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="38" cy="54" r="2.5" fill="#ffffff" />
            <circle cx="54" cy="54" r="2.5" fill="#ffffff" />
          </svg>
        </div>

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
            <div style={{ display: "flex", marginBottom: 50 }}>
              <img src={churchLogoUrl} alt="Church Logo" height={90} style={{ objectFit: "contain" }} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 40,
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 300, fontStyle: "italic", color: "#ffffff", lineHeight: 1 }}>happy</span>
            <span style={{ fontSize: 64, fontWeight: 900, color: "#c5a86a", letterSpacing: 3, lineHeight: 1.1, marginTop: 4 }}>BIRTHDAY</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginBottom: 35 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#c5a86a", lineHeight: 0.5, marginBottom: 10 }}>“</span>
            <span style={{ fontSize: 26, lineHeight: 1.6, color: "#9ca3af" }}>{message}</span>
          </div>

          <div
            style={{
              display: "flex",
              width: 240,
              height: 4,
              background: "#c5a86a",
              marginBottom: getDepartmentText(member) ? 20 : 35,
            }}
          />

          {getDepartmentText(member) && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#c5a86a",
                fontWeight: 600,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {getDepartmentText(member)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>
              Born: {getBirthDate(member)}
            </span>
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
              position: "relative",
              width: 440,
              height: 640,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 440,
                height: 640,
                border: "8px solid #ffffff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    background: "#1e1e24",
                  }}
                />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: -20,
                bottom: 40,
                width: 420,
                background: "#c5a86a",
                display: "flex",
                flexDirection: "column",
                padding: "16px 24px",
                boxShadow: "5px 5px 15px rgba(0,0,0,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: getNameFontSize(getDesignFullName(member), 26),
                  fontWeight: 900,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {getDesignFullName(member)}
              </span>
              {member.position && (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f3f4f6",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    marginTop: 4,
                  }}
                >
                  {member.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export const defaultMessages = [
  // "Wishing you a wonderful birthday filled with God's grace and blessings. May this new year of your life be filled with joy, peace, and abundant love!",
  "May the Lord continue to bless you and keep you. May His face shine upon you and give you peace throughout this new year.",
  // "On your special day, we celebrate the gift you are to our church family. May God's blessings overflow in your life today and always!",
  // "Rejoice, for this is the day the Lord has made! Happy Birthday! May you be blessed with good health, happiness, and divine favor.",
  // "Happy Birthday! As you mark another year of God's faithfulness, may you continue to grow in grace and in the knowledge of our Lord Jesus Christ.",
];
