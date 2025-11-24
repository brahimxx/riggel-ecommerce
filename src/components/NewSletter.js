import { MailOutlined } from "@ant-design/icons";
import { Input } from "antd";

const NewsLetter = () => {
  return (
    <div className=" relative   ">
      <div className="flex flex-col lg:flex-row font-integral justify-between py-[32px] lg:py-[36px] px-[24px] lg:px-[64px] bg-black rounded-3xl  lg:mx-auto h-[300px] lg:h-[200px] z-10 mx-4 max-w-[calc(1536px-120px)] ">
        <h2 className="text-white font-integral text-[26px] sm:text-[28px] sm:text-center lg:text-left lg:text-[36px] xl:text-[40px] font-extrabold lg:w-[60%] xl:w-[50%]">
          Stay up to date about our latest offers
        </h2>
        <form className="flex flex-col w-full lg:w-[300px] xl:w-[349px] h-[108px] justify-between">
          <Input
            id="newsletter-email"
            type="email"
            required
            prefix={
              <MailOutlined className="mx-[10px] flex  text-[16px] lg:text-2xl !text-gray-400 " />
            }
            placeholder="Enter your email address"
            className="w-full h-[48px] text-[10px] lg:text-[20px] xl:text-[22px] text-gray-800 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-3xl"
          />

          <button
            className="cursor-pointer w-full text-[10px] lg:text-[14px] xl:text-[16px] h-[46px] bg-white rounded-3xl "
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

export default NewsLetter;
