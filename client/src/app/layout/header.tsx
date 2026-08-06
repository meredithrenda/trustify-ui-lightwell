import type React from "react";
import { useContext, useReducer, useState } from "react";
import { type AuthContextProps, useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

import {
  Avatar,
  Brand,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Icon,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  type MenuToggleElement,
  NotificationBadge,
  NotificationBadgeVariant,
  PageToggleButton,
  Split,
  SplitItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";

import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";

import { ThemeSelector } from "@tsd-ui/core";

import { NotificationsContext } from "@app/components/NotificationsContext";
import { isAuthRequired } from "@app/Constants";
import getBranding from "@app/hooks/useBranding";
import { oidcSignoutArgs } from "@app/oidc";

import imgAvatar from "../images/avatar.svg";
import { AboutApp } from "./about";

export const HeaderApp: React.FC = () => {
  return isAuthRequired ? <HeaderWithAuth /> : <HeaderWithoutAuth />;
};

const HeaderWithAuth: React.FC = () => {
  const auth = useAuth();
  return <HeaderAppInner auth={auth} />;
};

const HeaderWithoutAuth: React.FC = () => {
  return <HeaderAppInner auth={null} />;
};

interface IHeaderAppInnerProps {
  auth: AuthContextProps | null;
}

const HeaderAppInner: React.FC<IHeaderAppInnerProps> = ({ auth }) => {
  const {
    masthead: { leftBrand, leftTitle, rightBrand, supportUrl },
  } = getBranding();

  const navigate = useNavigate();
  const {
    toggleDrawer,
    isDrawerExpanded,
    unreadCount,
    hasUnreadAttention,
    shouldNotifyBadge,
    clearShouldNotifyBadge,
  } = useContext(NotificationsContext);

  const [isAboutModalOpen, toggleIsAboutModalOpen] = useReducer(
    (state) => !state,
    false,
  );
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [isKebabDropdownOpen, setIsKebabDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const onHelpDropdownToggle = () => {
    setIsHelpDropdownOpen(!isHelpDropdownOpen);
  };

  const onKebabDropdownToggle = () => {
    setIsKebabDropdownOpen(!isKebabDropdownOpen);
  };

  const logout = () => {
    auth
      ?.signoutRedirect(oidcSignoutArgs)
      .then(() => {})
      .catch((err) => {
        console.error("Logout failed:", err);
        navigate("/");
      });
  };

  const notificationBadgeVariant = hasUnreadAttention
    ? NotificationBadgeVariant.attention
    : unreadCount > 0
      ? NotificationBadgeVariant.unread
      : NotificationBadgeVariant.read;

  return (
    <>
      <AboutApp isOpen={isAboutModalOpen} onClose={toggleIsAboutModalOpen} />

      <Masthead>
        <MastheadMain>
          <MastheadToggle>
            <PageToggleButton variant="plain" aria-label="Global navigation">
              <BarsIcon />
            </PageToggleButton>
          </MastheadToggle>
          <MastheadBrand
            data-codemods
            style={{
              alignItems: "center",
              gap: "var(--pf-t--global--spacer--sm)",
            }}
          >
            <MastheadLogo data-codemods>
              <Split>
                <SplitItem>
                  {leftBrand ? (
                    <Brand
                      src={leftBrand.src}
                      alt={leftBrand.alt}
                      heights={{ default: leftBrand.height }}
                    />
                  ) : null}
                </SplitItem>
                <SplitItem isFilled>
                  {leftTitle ? (
                    <Title
                      className="logo-pointer"
                      headingLevel={leftTitle?.heading ?? "h1"}
                      size={leftTitle?.size ?? "2xl"}
                    >
                      {leftTitle.text}
                    </Title>
                  ) : null}
                </SplitItem>
              </Split>
            </MastheadLogo>
            <Label color="purple">Lightwell demo</Label>
          </MastheadBrand>
        </MastheadMain>
        <MastheadContent>
          <Toolbar aria-label="toolbar" isFullHeight isStatic>
            <ToolbarContent>
              {/* toolbar items to always show */}
              <ToolbarGroup
                aria-label="header-toolbar-tasks"
                variant="action-group-plain"
                align={{ default: "alignEnd" }}
              >
                <ToolbarItem>
                  <NotificationBadge
                    variant={notificationBadgeVariant}
                    onClick={toggleDrawer}
                    aria-label="Notifications"
                    isExpanded={isDrawerExpanded}
                    count={unreadCount}
                    shouldNotify={shouldNotifyBadge && unreadCount > 0}
                    onAnimationEnd={clearShouldNotifyBadge}
                  />
                </ToolbarItem>
              </ToolbarGroup>

              {/* toolbar items to show at desktop sizes */}
              <ToolbarGroup
                aria-label="header-toolbar-desktop"
                variant="action-group-plain"
                gap={{ default: "gapNone", md: "gapMd" }}
                visibility={{
                  default: "hidden",
                  "2xl": "visible",
                  xl: "visible",
                  lg: "visible",
                  md: "hidden",
                }}
              >
                <ToolbarItem>
                  <Dropdown
                    isOpen={isHelpDropdownOpen}
                    onSelect={onHelpDropdownToggle}
                    onOpenChange={(isOpen: boolean) =>
                      setIsHelpDropdownOpen(isOpen)
                    }
                    popperProps={{ position: "right" }}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={onHelpDropdownToggle}
                        isExpanded={isHelpDropdownOpen}
                        variant="plain"
                        aria-label="About"
                      >
                        <HelpIcon />
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {supportUrl && (
                        <DropdownItem
                          key="support"
                          component="a"
                          to={supportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Support{" "}
                          <Icon isInline iconSize="sm">
                            <ExternalLinkAltIcon />
                          </Icon>
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="about"
                        onClick={toggleIsAboutModalOpen}
                      >
                        About
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
                <ToolbarItem>
                  <ThemeSelector />
                </ToolbarItem>
              </ToolbarGroup>

              {/* toolbar items to show at mobile sizes */}
              <ToolbarGroup
                aria-label="header-toolbar-mobile"
                variant="action-group-plain"
                gap={{ default: "gapNone", md: "gapMd" }}
                visibility={{ lg: "hidden" }}
              >
                <ToolbarItem>
                  <ThemeSelector />
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    isOpen={isKebabDropdownOpen}
                    onSelect={onKebabDropdownToggle}
                    onOpenChange={(isOpen: boolean) =>
                      setIsKebabDropdownOpen(isOpen)
                    }
                    popperProps={{ position: "right" }}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={onKebabDropdownToggle}
                        isExpanded={isKebabDropdownOpen}
                        variant="plain"
                        aria-label="About"
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {auth && (
                        <DropdownItem key="logout" onClick={logout}>
                          Logout
                        </DropdownItem>
                      )}
                      <Divider key="separator" component="li" />
                      {supportUrl && (
                        <DropdownItem
                          key="support"
                          component="a"
                          to={supportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Support{" "}
                          <Icon isInline iconSize="sm">
                            <ExternalLinkAltIcon />
                          </Icon>
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="about"
                        onClick={toggleIsAboutModalOpen}
                      >
                        About
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
              </ToolbarGroup>

              {/* Show the SSO menu at desktop sizes */}
              <ToolbarGroup
                aria-label="header-toolbar-sso"
                visibility={{
                  default: "hidden",
                  md: "visible",
                }}
              >
                {auth && (
                  <ToolbarItem
                    visibility={{ default: "hidden", md: "visible" }}
                  >
                    <Dropdown
                      isOpen={isUserDropdownOpen}
                      onSelect={() => setIsUserDropdownOpen(false)}
                      onOpenChange={(isOpen: boolean) =>
                        setIsUserDropdownOpen(isOpen)
                      }
                      popperProps={{ position: "right" }}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsUserDropdownOpen(!isUserDropdownOpen)
                          }
                          isFullHeight
                          isExpanded={isUserDropdownOpen}
                          icon={<Avatar src={imgAvatar} alt="" size="sm" />}
                        >
                          {auth.user?.profile.preferred_username ||
                            auth.user?.profile.sub}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem key="logout" onClick={logout}>
                          Logout
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                )}
              </ToolbarGroup>

              {rightBrand ? (
                <ToolbarGroup>
                  <ToolbarItem>
                    <Brand
                      src={rightBrand.src}
                      alt={rightBrand.alt}
                      heights={{ default: rightBrand.height }}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
              ) : null}
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    </>
  );
};
