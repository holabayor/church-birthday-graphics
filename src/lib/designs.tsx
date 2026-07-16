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
              fontSize: getNameFontSize(getFullName(member), 82),
              color: "white",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getFullName(member)}
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
              marginBottom: 35,
            }}
          />

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
              fontSize: getNameFontSize(getFullName(member), 78),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 30,
            }}
          >
            {getFullName(member)}
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
              marginBottom: 35,
            }}
          />

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
              fontSize: getNameFontSize(getFullName(member), 76),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getFullName(member)}
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
              marginBottom: 35,
            }}
          />

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
              fontSize: getNameFontSize(getFullName(member), 80),
              lineHeight: 1,
              fontWeight: 800,
              color: "white",
              marginBottom: member.position ? 20 : 30,
            }}
          >
            {getFullName(member)}
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
              marginBottom: 35,
            }}
          />

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
              fontSize: getNameFontSize(getFullName(member), 78),
              fontWeight: 800,
              lineHeight: 1,
              color: "white",
              marginBottom: member.position ? 20 : 28,
            }}
          >
            {getFullName(member)}
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
              marginBottom: 36,
            }}
          />

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
];

export const defaultMessages = [
  // "Wishing you a wonderful birthday filled with God's grace and blessings. May this new year of your life be filled with joy, peace, and abundant love!",
  "May the Lord continue to bless you and keep you. May His face shine upon you and give you peace throughout this new year.",
  // "On your special day, we celebrate the gift you are to our church family. May God's blessings overflow in your life today and always!",
  // "Rejoice, for this is the day the Lord has made! Happy Birthday! May you be blessed with good health, happiness, and divine favor.",
  // "Happy Birthday! As you mark another year of God's faithfulness, may you continue to grow in grace and in the knowledge of our Lord Jesus Christ.",
];
