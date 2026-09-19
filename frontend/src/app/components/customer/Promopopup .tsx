import { useEffect, useState } from "react";
import { X, Gift, ShieldCheck, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------

const POPUP_STORAGE_KEY = "first_photo_popup_last_shown";
const POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const FIRST_PHOTO_API =
  "https://aabharan.vercel.app/api/admin/store-imgs?type=FIRST_PHOTO";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface StoreImage {
  id?: string;
  img?: string;
  imageUrl?: string;
  url?: string;
  image?: string;
  src?: string;
  type?: string;
}

interface PromoPopupProps {
  eyebrow?: string;
  title?: string;
  highlightedText?: string;
  subtitle?: string;
  note?: string;

  ctaText?: string;
  ctaLink?: string;

  badgeLeftText?: string;
  badgeRightText?: string;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function extractImageUrl(data: any): string | null {
  if (!data) return null;

  // API directly returns string
  if (typeof data === "string") {
    return data.trim() || null;
  }

  // API directly returns array
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractImageUrl(item);
      if (result) return result;
    }

    return null;
  }

  // Common direct image properties
  const possibleDirectUrl =
    data.img ||
    data.imageUrl ||
    data.url ||
    data.image ||
    data.src ||
    data.photoUrl ||
    data.photo ||
    data.fileUrl;

  if (
    typeof possibleDirectUrl === "string" &&
    possibleDirectUrl.trim().length > 0
  ) {
    return possibleDirectUrl.trim();
  }

  // Common wrapped API response formats
  const possibleContainers = [
    data.data,
    data.images,
    data.storeImages,
    data.storeImgs,
    data.result,
    data.results,
  ];

  for (const container of possibleContainers) {
    const result = extractImageUrl(container);

    if (result) {
      return result;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function PromoPopup({
  eyebrow = "FREE",
  title = "GIFT BOX",
  highlightedText = "FREE Gift Box",
  subtitle = "Shop For ₹1200+ and Get",
  note = "Worth ₹299",
  ctaText,
  ctaLink,
  badgeLeftText = "Premium Quality",
  badgeRightText = "Limited Time Offer",
}: PromoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [promoImage, setPromoImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [imageFailed, setImageFailed] = useState(false);

  // ---------------------------------------------------------------------------
  // Check popup cooldown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const initializePopup = async () => {
      try {
        // ---------------------------------------------------------------------
        // STEP 1: Check if popup was already shown within last 24 hours
        // ---------------------------------------------------------------------

        const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);

        if (lastShown) {
          const lastShownTime = Number(lastShown);

          if (
            Number.isFinite(lastShownTime) &&
            Date.now() - lastShownTime < POPUP_COOLDOWN_MS
          ) {
            setLoading(false);
            return;
          }
        }

        // ---------------------------------------------------------------------
        // STEP 2: Fetch FIRST_PHOTO
        // ---------------------------------------------------------------------

        try {
          const response = await fetch(FIRST_PHOTO_API, {
            method: "GET",

            headers: {
              Accept: "application/json",
            },

            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(
              `FIRST_PHOTO API returned ${response.status}`
            );
          }

          const data = await response.json();

          console.log("[PromoPopup] FIRST_PHOTO response:", data);

          const imageUrl = extractImageUrl(data);

          if (imageUrl) {
            setPromoImage(imageUrl);
          } else {
            console.warn(
              "[PromoPopup] FIRST_PHOTO not found. Using fallback popup."
            );

            setPromoImage(null);
          }
        } catch (error) {
          console.error(
            "[PromoPopup] Unable to fetch FIRST_PHOTO:",
            error
          );

          // API failure = use dummy content
          setPromoImage(null);
        }

        setLoading(false);

        // ---------------------------------------------------------------------
        // STEP 3: Open popup after page settles
        // ---------------------------------------------------------------------

        timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
      } catch (error) {
        console.error(
          "[PromoPopup] Popup initialization error:",
          error
        );

        setLoading(false);
      }
    };

    initializePopup();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Close popup
  // ---------------------------------------------------------------------------

  const handleClose = () => {
    setIsOpen(false);

    try {
      localStorage.setItem(
        POPUP_STORAGE_KEY,
        Date.now().toString()
      );
    } catch (error) {
      console.warn(
        "[PromoPopup] Could not store popup timestamp:",
        error
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Don't render anything while checking popup state
  // ---------------------------------------------------------------------------

  if (loading) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.2,
          }}
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/65
            backdrop-blur-[3px]
            px-3
            py-4
            sm:px-6
            sm:py-6
          "
          onClick={handleClose}
        >
          {/* ---------------------------------------------------------------- */}
          {/* IF FIRST_PHOTO EXISTS */}
          {/* ---------------------------------------------------------------- */}

          {promoImage && !imageFailed ? (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 24,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                w-auto
                max-w-[94vw]
                sm:max-w-[88vw]
                md:max-w-[720px]
                lg:max-w-[820px]
                max-h-[92vh]
                overflow-hidden
                rounded-xl
                sm:rounded-2xl
                bg-white
                shadow-[0_25px_80px_rgba(0,0,0,0.35)]
              "
            >
              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close popup"
                className="
                  absolute
                  top-2
                  right-2
                  sm:top-3
                  sm:right-3
                  z-20

                  flex
                  items-center
                  justify-center

                  w-7
                  h-7

                  sm:w-9
                  sm:h-9

                  rounded-full

                  bg-black/65
                  hover:bg-black/80

                  text-white

                  shadow-md

                  transition-all
                  duration-200

                  cursor-pointer
                "
              >
                <X
                  className="
                    w-4
                    h-4
                    sm:w-[18px]
                    sm:h-[18px]
                  "
                  strokeWidth={2.2}
                />
              </button>

              {/* Promotional Image */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                  bg-white
                "
              >
                <img
                  src={promoImage}
                  alt="Promotional offer"
                  onError={() => {
                    console.error(
                      "[PromoPopup] FIRST_PHOTO failed to load:",
                      promoImage
                    );

                    setImageFailed(true);
                  }}
                  className="
                    block
                    w-auto
                    h-auto

                    max-w-[94vw]
                    sm:max-w-[88vw]
                    md:max-w-[720px]
                    lg:max-w-[820px]

                    max-h-[90vh]

                    object-contain
                  "
                />
              </div>
            </motion.div>
          ) : (
            /* ---------------------------------------------------------------- */
            /* FALLBACK DUMMY POPUP */
            /* ---------------------------------------------------------------- */

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 26,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative

                w-full
                max-w-[680px]

                max-h-[92vh]

                overflow-y-auto

                bg-[#fdf9f2]

                rounded-xl
                sm:rounded-2xl

                shadow-2xl
              "
            >
              {/* Close */}

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close popup"
                className="
                  absolute

                  top-2
                  right-2

                  sm:top-4
                  sm:right-4

                  z-20

                  w-7
                  h-7

                  sm:w-9
                  sm:h-9

                  rounded-full

                  bg-white/95

                  hover:bg-white

                  shadow-md

                  flex
                  items-center
                  justify-center

                  transition-all

                  cursor-pointer
                "
              >
                <X
                  className="
                    w-4
                    h-4
                    sm:w-[18px]
                    sm:h-[18px]
                    text-gray-800
                  "
                />
              </button>

              {/* Main section */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                "
              >
                {/* Text */}

                <div
                  className="
                    flex-1

                    px-5
                    pt-10
                    pb-6

                    sm:p-8
                    md:p-10

                    flex
                    flex-col
                    justify-center

                    gap-3
                    sm:gap-4
                  "
                >
                  <div>
                    <h2
                      className="
                        text-3xl
                        sm:text-4xl
                        md:text-5xl

                        font-black

                        text-[#7a1f2b]

                        leading-none
                        tracking-tight
                      "
                    >
                      {eyebrow}
                    </h2>

                    <h2
                      className="
                        text-3xl
                        sm:text-4xl
                        md:text-5xl

                        font-black

                        text-[#7a1f2b]

                        leading-tight
                        tracking-tight
                      "
                    >
                      {title}
                    </h2>
                  </div>

                  <div className="w-20 sm:w-24 h-px bg-[#7a1f2b]/40 my-1" />

                  <p
                    className="
                      text-sm
                      sm:text-base
                      md:text-lg

                      text-gray-800

                      leading-relaxed
                    "
                  >
                    {subtitle}{" "}

                    <span className="font-bold text-[#7a1f2b]">
                      {highlightedText}
                    </span>

                    <br />

                    {note}
                  </p>

                  <div className="flex items-center gap-3 mt-1 sm:mt-2">
                    <div
                      className="
                        w-9
                        h-9
                        sm:w-11
                        sm:h-11

                        rounded-full

                        bg-[#7a1f2b]/10

                        flex
                        items-center
                        justify-center

                        flex-shrink-0
                      "
                    >
                      <Gift
                        className="
                          w-[18px]
                          h-[18px]
                          sm:w-5
                          sm:h-5

                          text-[#7a1f2b]
                        "
                      />
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      Perfect for you or your loved ones!
                    </p>
                  </div>

                  {ctaText && ctaLink && (
                    <a
                      href={ctaLink}
                      className="
                        mt-2
                        sm:mt-4

                        inline-flex
                        items-center
                        justify-center

                        px-5
                        py-2.5

                        sm:px-6
                        sm:py-3

                        bg-[#7a1f2b]

                        text-white

                        text-sm
                        sm:text-base

                        font-bold

                        rounded-lg

                        shadow-md

                        hover:bg-[#601622]

                        transition-colors

                        w-full
                        sm:w-fit
                      "
                    >
                      {ctaText}
                    </a>
                  )}
                </div>

                {/* Image */}

                <div
                  className="
                    flex-1
                    relative

                    min-h-[180px]
                    sm:min-h-[300px]

                    bg-gradient-to-br
                    from-[#f6e4d8]
                    to-[#ecd1bf]

                    flex
                    items-center
                    justify-center

                    overflow-hidden
                  "
                >
                  <div className="text-center px-6 py-8">
                    <Gift
                      className="
                        w-14
                        h-14
                        sm:w-20
                        sm:h-20

                        mx-auto

                        text-[#7a1f2b]

                        mb-4
                      "
                    />

                    <p
                      className="
                        text-[#7a1f2b]

                        text-lg
                        sm:text-xl

                        font-extrabold
                      "
                    >
                      Special Gift
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Just for you
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom badges */}

              <div
                className="
                  bg-[#7a1f2b]

                  py-3
                  px-4

                  flex
                  flex-wrap

                  items-center
                  justify-center

                  gap-2
                  sm:gap-6
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-1.5

                    text-white

                    text-[11px]
                    sm:text-sm

                    font-medium
                  "
                >
                  <ShieldCheck className="w-4 h-4" />

                  {badgeLeftText}
                </div>

                <div className="hidden sm:block w-px h-4 bg-white/30" />

                <div
                  className="
                    flex
                    items-center
                    gap-1.5

                    text-white

                    text-[11px]
                    sm:text-sm

                    font-medium
                  "
                >
                  <Gift className="w-4 h-4" />

                  {badgeRightText}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}