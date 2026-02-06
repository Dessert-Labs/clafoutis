interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "account", label: "Account" },
  { id: "password", label: "Password" },
  { id: "notifications", label: "Notifications" },
];

const tabContent: Record<string, string> = {
  account:
    "Manage your account settings, update your profile information, and configure your preferences.",
  password:
    "Change your password, enable two-factor authentication, and manage security settings.",
  notifications:
    "Configure email notifications, push alerts, and manage your notification preferences.",
};

export function TabsPreview({ activeTab, onTabChange }: Readonly<TabsProps>) {
  return (
    <div>
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ backgroundColor: "rgb(var(--colors-tabs-list-bg))" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? "rgb(var(--colors-tabs-active-bg))"
                  : "rgb(var(--colors-tabs-trigger-bg))",
              color:
                activeTab === tab.id
                  ? "rgb(var(--colors-tabs-active-text))"
                  : "rgb(var(--colors-tabs-trigger-text))",
            }}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="mt-4 rounded-lg border p-4"
        style={{
          borderColor: "rgb(var(--colors-tabs-border))",
          color: "rgb(var(--colors-text-secondary))",
        }}
      >
        <p className="text-sm">{tabContent[activeTab]}</p>
      </div>
    </div>
  );
}
