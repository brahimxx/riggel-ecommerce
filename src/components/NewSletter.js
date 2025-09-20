import { MailOutlined } from "@ant-design/icons";
import { Input } from "antd";

const NewSletter = () => {
  return (
    <div className="relative">
      <div className="flex font-integral justify-between py-[36px] px-[64px] bg-black rounded-3xl max-w-screen-2xl mx-auto h-[180px] z-10">
        <h2 className="text-white font-integral text-[40px] font-extrabold w-[50%]">
          Stay up to date about our latest offers
        </h2>
        <form className="flex flex-col w-[349px] h-[108px] justify-between">
          <Input
            id="newsletter-email"
            type="email"
            required
            prefix={
              <MailOutlined className="mx-[10px] flex items-center text-2xl !text-gray-500 " />
            }
            placeholder="Enter your email address"
            className="w-full h-[48px] text-[22px] text-gray-800 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-3xl"
          />

          <button
            className="cursor-pointer w-full text-[16px] h-[46px]  bg-white rounded-3xl"
            type="submit"
          >
            Subscribe to Newsletter
          </button>
        </form>
      </div>
      <div className="absolute h-[50%] bottom-0 w-full bg-[#F0F0F0] -z-1"></div>
    </div>
  );
};

export default NewSletter;
