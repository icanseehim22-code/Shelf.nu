import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  AlarmClockIcon,
  BellIcon,
  BoxesIcon,
  CalendarRangeIcon,
  ChartLineIcon,
  ClipboardCheckIcon,
  FileBarChartIcon,
  FuelIcon,
  HomeIcon,
  MapPinIcon,
  MessageCircleIcon,
  Package,
  PackageOpenIcon,
  QrCodeIcon,
  ScanBarcodeIcon,
  SettingsIcon,
  TagsIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { useLoaderData } from "react-router";
import { UpgradeMessage } from "~/components/marketing/upgrade-message";
import When from "~/components/when/when";
import type { loader } from "~/routes/_layout+/_layout";
import { isPersonalOrg } from "~/utils/organization";
import { useCurrentOrganization } from "./use-current-organization";
import { useUserRoleHelper } from "./user-user-role-helper";

type BaseNavItem = {
  title: string;
  hidden?: boolean;
  Icon: LucideIcon;
  disabled?: boolean | { reason: ReactNode };
  badge?: {
    show: boolean;
    variant?: "unread";
  };
};

export type ChildNavItem = BaseNavItem & {
  type: "child";
  to: string;
  target?: string;
  /**
   * Forces a full-page document navigation instead of client-side routing.
   * Required for links that point outside the Remix app (e.g. the static
   * `/abastecimento/` app served by the Vercel proxy), which the React Router
   * client would otherwise try to match as an internal route and 404 on.
   */
  reloadDocument?: boolean;
};

export type ParentNavItem = BaseNavItem & {
  type: "parent";
  children: Omit<ChildNavItem, "type" | "Icon">[];
};

type LabelNavItem = Omit<BaseNavItem, "Icon"> & {
  type: "label";
};

type ButtonNavItem = BaseNavItem & {
  type: "button";
  onClick: () => void;
};

export type NavItem =
  | ChildNavItem
  | ParentNavItem
  | LabelNavItem
  | ButtonNavItem;

export function useSidebarNavItems() {
  const { isAdmin, canUseBookings, subscription, unreadUpdatesCount } =
    useLoaderData<typeof loader>();
  const { isBaseOrSelfService } = useUserRoleHelper();
  const currentOrganization = useCurrentOrganization();
  const isPersonalOrganization = isPersonalOrg(currentOrganization);

  const bookingDisabled = useMemo(() => {
    if (canUseBookings) {
      return false;
    }

    return {
      reason: (
        <div>
          <h5>Disabled</h5>
          <p>
            Booking is a premium feature only available for Team workspaces.
          </p>

          <When truthy={!!subscription} fallback={<UpgradeMessage />}>
            <p>Please switch to your team workspace to access this feature.</p>
          </When>
        </div>
      ),
    };
  }, [canUseBookings, subscription]);

  const topMenuItems: NavItem[] = [
    {
      type: "child",
      title: "Painel Admin",
      to: "/admin-dashboard/users",
      Icon: ChartLineIcon,
      hidden: !isAdmin,
    },
    {
      type: "label",
      title: "Sistemas",
    },
    {
      type: "child",
      title: "Abastecimento",
      to: "/abastecimento/",
      Icon: FuelIcon,
      // Full-page navigation: /abastecimento/ is the separate static app served
      // by the Vercel proxy, not a Remix route — client-side routing would 404.
      reloadDocument: true,
    },
    {
      type: "label",
      title: "Gestão de ativos",
    },
    {
      type: "child",
      title: "Início",
      to: "/home",
      Icon: HomeIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Ativos",
      to: "/assets",
      Icon: PackageOpenIcon,
    },
    {
      type: "child",
      title: "Kits",
      to: "/kits",
      Icon: Package,
    },
    {
      type: "child",
      title: "Categorias",
      to: "/categories",
      Icon: BoxesIcon,
      hidden: isBaseOrSelfService,
    },

    {
      type: "child",
      title: "Etiquetas",
      to: "/tags",
      Icon: TagsIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Locais",
      to: "/locations",
      Icon: MapPinIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Auditorias",
      to: "/audits",
      Icon: ClipboardCheckIcon,
    },
    {
      type: "parent",
      title: "Reservas",
      Icon: CalendarRangeIcon,
      disabled: bookingDisabled,
      children: [
        {
          title: "Ver reservas",
          to: "/bookings",
          disabled: bookingDisabled,
        },
        {
          title: "Calendário",
          to: "/calendar",
          disabled: bookingDisabled,
        },
      ],
    },
    {
      type: "child",
      title: "Lembretes",
      Icon: AlarmClockIcon,
      hidden: isBaseOrSelfService,
      to: "/reminders",
    },
    {
      type: "child",
      title: "Relatórios",
      Icon: FileBarChartIcon,
      hidden: isBaseOrSelfService,
      to: "/reports",
    },
    {
      type: "label",
      title: "Organização",
      hidden: isBaseOrSelfService,
    },
    {
      type: "parent",
      title: "Equipe",
      Icon: UsersRoundIcon,
      hidden: isBaseOrSelfService,
      children: [
        {
          title: "Usuários",
          to: "/settings/team/users",
          hidden: isPersonalOrganization,
        },
        {
          title: "Convites pendentes",
          to: "/settings/team/invites",
          hidden: isPersonalOrganization,
        },
        {
          title: "Membros não registrados",
          to: "/settings/team/nrm",
        },
      ],
    },
    {
      type: "parent",
      title: "Configurações do workspace",
      Icon: SettingsIcon,
      hidden: isBaseOrSelfService,
      children: [
        {
          title: "Geral",
          to: "/settings/general",
        },
        {
          title: "Reservas",
          to: "/settings/bookings",
          hidden: isPersonalOrganization,
        },
        {
          title: "Campos personalizados",
          to: "/settings/custom-fields",
        },
      ],
    },
  ];

  const bottomMenuItems: NavItem[] = [
    {
      type: "child",
      title: "Etiquetas de ativos",
      to: `https://store.estoquesoftsystem.com/?ref=shelf_webapp_sidebar`,
      Icon: QrCodeIcon,
      target: "_blank",
    },
    {
      type: "child",
      title: "Leitor de QR",
      to: "/scanner",
      Icon: ScanBarcodeIcon,
    },
    {
      type: "button",
      title: "Novidades",
      Icon: BellIcon,
      badge: {
        show: (unreadUpdatesCount || 0) > 0,
        variant: "unread" as const,
      },
      onClick: () => {
        // This will be handled by the sidebar component with popover
      },
    },
    {
      type: "button",
      title: "Dúvidas/Feedback",
      Icon: MessageCircleIcon,
      onClick: () => {
        // Handled by FeedbackNavItem in sidebar-nav.tsx
      },
    },
  ];

  return {
    topMenuItems: removeHiddenNavItems(topMenuItems),
    bottomMenuItems: removeHiddenNavItems(bottomMenuItems),
  };
}

function removeHiddenNavItems(navItems: NavItem[]) {
  return navItems
    .filter((item) => !item.hidden)
    .map((item) => {
      if (item.type === "parent") {
        return {
          ...item,
          children: item.children.filter((child) => !child.hidden),
        };
      }

      return item;
    });
}
