import { Link } from "react-router-dom";

type LogoVariant = "full" | "horizontal" | "icon" | "sidebar";

interface CapidocLogoProps {
  variant?: LogoVariant;
  className?: string;
  linkTo?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    capybara: "h-8",
    name: "h-6",
    icon: "h-7 w-7",
    horizontal: "h-10",
    sidebarIcon: "h-7 w-7",
    sidebarText: "text-base",
  },
  md: {
    capybara: "h-12",
    name: "h-10",
    icon: "h-9 w-9",
    horizontal: "h-14",
    sidebarIcon: "h-9 w-9",
    sidebarText: "text-lg",
  },
  lg: {
    capybara: "h-16",
    name: "h-14",
    icon: "h-12 w-12",
    horizontal: "h-20",
    sidebarIcon: "h-12 w-12",
    sidebarText: "text-xl",
  },
};

const CapidocLogo = ({
  variant = "full",
  className = "",
  linkTo = "/",
  size = "md",
}: CapidocLogoProps) => {
  const sizes = sizeConfig[size];

  const renderLogo = () => {
    switch (variant) {
      case "full":
        return (
          <div className={`flex items-center ${className}`}>
            <img
              src="/imgs/capidoc_capybara.png"
              alt="Capidoc"
              className={`${sizes.capybara} w-auto`}
              style={{ marginRight: "-12px" }}
            />
            <img
              src="/imgs/capidoc_name.png"
              alt="Capidoc"
              className={`${sizes.name} w-auto`}
            />
          </div>
        );

      case "horizontal":
        return (
          <div className={`flex items-center ${className}`} style={{ transform: "scale(0.8)", marginLeft: "-32px" }}>
            <img
              src="/imgs/capidoc_capybara.png" 
              alt="Capidoc"
              className={`${sizes.capybara} w-auto`} 
              style={{ marginRight: "-12px" }}
            />
            <img
              src="/imgs/capidoc_name.png"
              alt="Capidoc"
              className={`${sizes.name} w-auto`}
            />
          </div>
        );

      case "icon":
        return (
          <img
            src="/imgs/capidoc.png"
            alt="Capidoc"
            className={`${sizes.icon} ${className}`}
          />
        );

      case "sidebar":
        return (
          <div className={`flex items-center gap-2 ${className}`}>
            <img
              src="/imgs/capidoc.png"
              alt="Capidoc"
              className={sizes.sidebarIcon}
            />
            <span className={`${sizes.sidebarText} font-bold`}>
              <span style={{ color: "#FD8216" }}>CAPI</span>
              <span style={{ color: "#1470BB" }}>DOC</span>
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (linkTo) {
    return <Link to={linkTo}>{renderLogo()}</Link>;
  }

  return renderLogo();
};

export default CapidocLogo;
