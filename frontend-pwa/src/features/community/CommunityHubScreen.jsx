import { useState } from "react";
import { ArrowLeft, Users, MapPin, PenLine, Image } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors, liquidGlass } from "../../utils/colors.js";

export function CommunityHubScreen({ isOnline, isDark, params }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const colors = getColors(isDark ?? true);

  const posts = state.communityPosts ?? [];
  const [composerOpen, setComposerOpen] = useState(false);
  const [postBody, setPostBody] = useState("");
  const [postLocation, setPostLocation] = useState("");

  function handleSubmitPost() {
    if (!postBody.trim()) return;
    setPostBody("");
    setPostLocation("");
    setComposerOpen(false);
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "inherit",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36 }}
          aria-label="Go back"
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: colors.text, flex: 1, textAlign: "center" }}>
          {t("screen.community.title")}
        </span>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 999,
            backgroundColor: Colors.brandGreen + "22",
            color: Colors.brandGreen,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          <PenLine size={14} />
          {t("screen.community.share")}
        </button>
      </div>

      {/* Posts list */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, paddingBottom: 100 }}>
        {posts.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 80,
              paddingLeft: 32,
              paddingRight: 32,
              gap: 12,
              textAlign: "center",
            }}
          >
            <Users size={48} color={colors.subtext} />
            <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
              {t("screen.community.no_posts_yet")}
            </p>
            <p style={{ fontSize: 14, color: colors.subtext, margin: 0 }}>
              {t("screen.community.first_to_share")}
            </p>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                borderRadius: 999,
                backgroundColor: Colors.brandGreen,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              <PenLine size={16} />
              {t("screen.community.share_an_update")}
            </button>
          </div>
        ) : (
          posts.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Post header */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.brandGreen,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {(item.author ?? "?").charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
                      {item.author}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 999,
                        backgroundColor: item.verified
                          ? Colors.brandGreen + "22"
                          : colors.surface,
                        color: item.verified ? Colors.brandGreen : colors.muted,
                      }}
                    >
                      {item.verified
                        ? t("screen.community.verified")
                        : t("screen.community.pending")}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={11} color={colors.subtext} />
                    <span style={{ fontSize: 12, color: colors.subtext }}>{item.location}</span>
                  </div>
                </div>
              </div>

              {/* Post body */}
              <p style={{ fontSize: 14, lineHeight: "20px", color: colors.text, margin: 0 }}>
                {item.body}
              </p>

              {/* Photo placeholder */}
              {item.photoUri && (
                <div
                  style={{
                    borderRadius: 10,
                    height: 80,
                    backgroundColor: colors.surface,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Image size={32} color={colors.subtext} />
                  <span style={{ fontSize: 12, color: colors.subtext }}>
                    {t("screen.community.photo_in")}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Composer bottom sheet */}
      {composerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setComposerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              borderRadius: "24px 24px 0 0",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              ...liquidGlass(isDark),
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                {t("screen.community.share_an_update")}
              </span>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.muted,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Heavy smoke nearby? Clear blue sky? Tell the community what you're seeing."
              style={{
                width: "100%",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                padding: 12,
                fontSize: 14,
                resize: "none",
                outline: "none",
                minHeight: 120,
                backgroundColor: colors.bg,
                color: colors.text,
                boxSizing: "border-box",
              }}
            />
            <input
              type="text"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="Location (e.g. Accra, Kaneshie)"
              style={{
                width: "100%",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                padding: 12,
                fontSize: 14,
                outline: "none",
                backgroundColor: colors.bg,
                color: colors.text,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={handleSubmitPost}
              disabled={!postBody.trim()}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                backgroundColor: Colors.brandGreen,
                opacity: postBody.trim() ? 1 : 0.5,
                border: "none",
                cursor: postBody.trim() ? "pointer" : "default",
              }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
