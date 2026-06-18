import { config } from "~/config/shelf.config";
import { tw } from "~/utils/tw";
import When from "../when/when";

/**
 * Logo shown in the sidebar
 * If a custom logo is used, we dynamically show that or the symbol depending on {optimisticMinimizedSidebar}
 */
export const ShelfSidebarLogo = ({ minimized }: { minimized: boolean }) => {
  const { logoPath } = config;

  // Show the orange symbol icon plus the EstoqueSoftSystem wordmark as text.
  // The wordmark is rendered as text (not the original "shelf" image/SVG) so
  // the brand reads correctly without needing a custom logo image asset.
  return (
    <>
      <img
        src={logoPath?.symbol ?? "/static/images/shelf-symbol.png"}
        alt="EstoqueSoftSystem Logo"
        className="mx-1.5 inline h-[32px] transition duration-150 ease-linear"
      />
      <When truthy={!minimized}>
        <span className="logo-text whitespace-nowrap text-base font-semibold text-gray-900 transition duration-150 ease-linear">
          EstoqueSoftSystem
        </span>
      </When>
    </>
  );
};

/**
 * Logo shown in the header for mobile screen sizes
 */
export const ShelfMobileLogo = () => {
  const { logoPath } = config;

  if (logoPath) {
    return (
      <img
        src={logoPath.fullLogo}
        alt="EstoqueSoftSystem Logo"
        className="h-full"
      />
    );
  }

  return (
    <img
      src="/static/images/logo-full-color(x2).png"
      alt="logo"
      className="h-full"
    />
  );
};

/**
 * Lego symbol
 */
export const ShelfSymbolLogo = ({ className }: { className?: string }) => {
  const { logoPath } = config;
  const classes = tw("mx-auto mb-2 size-12", className);

  if (logoPath) {
    return (
      <img
        src={logoPath.symbol}
        alt="EstoqueSoftSystem Logo"
        className={classes}
      />
    );
  }

  return (
    <img src="/static/images/shelf-symbol.png" alt="logo" className={classes} />
  );
};

/**
 * Full logo
 */
export const ShelfFullLogo = ({ className }: { className?: string }) => {
  const { logoPath } = config;
  const classes = tw(className);

  if (logoPath) {
    return (
      <img
        src={logoPath.fullLogo}
        alt="EstoqueSoftSystem Logo"
        className={classes}
      />
    );
  }

  return (
    <img
      src="/static/images/logo-full-color(x2).png"
      alt="logo"
      className={classes}
    />
  );
};
