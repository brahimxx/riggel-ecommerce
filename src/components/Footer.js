import {
  FacebookOutlined,
  InstagramOutlined,
  GithubOutlined,
  TwitterOutlined,
} from "@ant-design/icons";

const NavSection = ({ title, links }) => (
  <div className="flex flex-col gap-5">
    <span className="uppercase font-semibold text-[16px] text-grey/50 ">
      {title}
    </span>
    <ul className="flex flex-col gap-[15px]">
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href || "/"} className="hover:border-b-1 pb-1 ">
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <>
      <div className="bg-[#F0F0F0] ">
        <div className="relative text-[14px] text-grey/95 px-[16px] xxl:max-w-screen-xxl xxl:px-20 z-10 max-w-screen-2xl mx-auto">
          <div className="flex flex-col justify-between   lg:flex-row lg:justify-normal z-20 xxl:items-center">
            <div className="flex flex-col text-left py-[30px] lg:py-[40px] px-[20px] gap-1 lg:gap-5  lg:w-[30%]  lg:border-b-0 xxl:px-[40px] xxl:w-[521px] xxl:py-[80px]">
              <span className="font-integral text-[34px] font-semibold whitespace-nowrap ">
                SHOP.CO
              </span>
              <span className="text-gray-500 lg:text-[14px] ">
                We have clothes that suits your style and which you're proud to
                wear. From women to men.
              </span>
              <div className="flex gap-2 lg:pt-0 pt-2">
                <FacebookOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <InstagramOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <GithubOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <TwitterOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
              </div>
            </div>

            <div className="flex flex-row py-[40px] px-4 lg:px-[60px] justify-center gap-10 lg:justify-around  w-full  lg:gap-[60px] xxl:gap-[100px]">
              <div className="flex flex-col justify-between w-[35%]  gap-[40px] lg:flex-row lg:items-start lg:gap-[60px] xxl:gap-[100px]">
                <NavSection
                  title="Company"
                  links={["About", "Features", "Work", "Career"]}
                />
                <NavSection
                  title="Help"
                  links={[
                    "Customer Support",
                    "Delivery Details",
                    "Terms & Conditions",
                    "Privacy Policy",
                  ]}
                />
              </div>
              <div className="flex flex-col items-center justify-between w-[35%] gap-[40px] lg:flex-row lg:items-start lg:gap-[60px] xxl:lg:gap-[100px]">
                <NavSection
                  title="FAQ"
                  links={["Account", "Manage Deliveries", "Orders", "Payments"]}
                />
                <NavSection
                  title="Resources"
                  links={[
                    "Free eBooks",
                    "Development Tutorial",
                    "How to - Blog",
                    "Youtube Playlist",
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
