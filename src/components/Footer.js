import {
  FacebookOutlined,
  InstagramOutlined,
  GithubOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";

const NavSection = ({ title, links }) => (
  <div className="flex flex-col gap-5">
    <span className="uppercase font-semibold text-[16px] text-grey/50 ">
      {title}
    </span>
    <ul className="flex flex-col gap-[15px]">
      {links.map((link, index) => (
        <li key={index}>
          <a
            href={link.href || "/"}
            className="hover:border-b-1 pb-1 lg:text-nowrap"
          >
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
        <div className="relative text-[14px] text-grey/95  xxl:max-w-screen-xxl xxl:px-20 z-10 max-w-screen-2xl mx-auto">
          <div className="flex flex-col justify-between   md:flex-row md:justify-normal z-20 xxl:items-center">
            <div className="md:-mt-2 flex flex-col text-left pt-[30px] md:py-[40px] px-[20px] gap-1 md:gap-5  md:w-[30%]  md:border-b-0 xxl:px-[40px] xxl:w-[521px] xxl:py-[80px]">
              <Link href="/" className="flex items-center overflow-hidden">
                {/* R logo */}

                <Image
                  src="/logo.png"
                  alt="Riggel Logo"
                  width={40}
                  height={40}
                  priority
                />

                {/* Wrapper for fade + text */}
                <div className="relative flex items-center">
                  {/* Static fade strip from right edge of the image */}
                  <div className="z-20 pointer-events-none absolute left-0 top-0 h-full w-8" />
                  <span className="font-integral text-[#669900] ml-[2px] text-2xl font-bold whitespace-nowrap ">
                    iggel
                  </span>
                </div>
              </Link>
              <span className="text-gray-500 text-[14px] lg:text-4">
                We have clothes that suits your style and which you're proud to
                wear. From women to men.
              </span>
              <div className="flex gap-2 md:pt-0 pt-2">
                <FacebookOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <InstagramOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <GithubOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
                <TwitterOutlined className="text-4xl cursor-pointer hover:scale-120 duration-50" />
              </div>
            </div>

            <div className="flex py-[40px] px-4 justify-between gap-10 md:justify-around  w-full ">
              <div className="flex flex-col min-[650px]:flex-row justify-between lg:justify-around gap-[40px] md:flex-row md:items-start lg:w-[50%]">
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
              <div className="flex flex-col text-left min-[650px]:flex-row lg:justify-around gap-[40px] md:flex-row justify-end lg:w-[50%]">
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
