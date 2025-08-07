"use";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Avatar, Space, Dropdown, message } from "antd";
import { useRouter } from "next/navigation";

const ProfileMenu = () => {
  const router = useRouter();

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case "1":
        message.info("My Account is disabled.");
        break;
      case "2":
        router.push("/profile"); // Navigate to profile page
        break;
      case "3":
        router.push("/settings"); // Navigate to settings page
        break;
      case "4":
        // Call your sign out API route or function
        fetch("/api/auth/logout", { method: "POST" }).then(() => {
          router.push("/login"); // Redirect to login page after logout
        });
        break;
      default:
        break;
    }
  };

  const items = [
    {
      key: "1",
      label: "My Account",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "Profile",
      extra: "⌘P",
    },
    {
      key: "3",
      label: "Settings",
      icon: <SettingOutlined />,
      extra: "⌘S",
    },
    {
      key: "4",
      label: "Sign out",
      icon: <LogoutOutlined />,
      extra: "⌘B",
    },
  ];

  return (
    <Dropdown
      menu={{ items, onClick: handleMenuClick }}
      placement="bottomRight"
      arrow
      autoAdjustOverflow={true}
      // note: paddingBlock prop is invalid on Dropdown; consider wrapping with styled div if needed
    >
      <a onClick={(e) => e.preventDefault()}>
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
        </Space>
      </a>
    </Dropdown>
  );
};

export default ProfileMenu;
