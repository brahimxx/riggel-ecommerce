import { Rate } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const FeedbackCard = ({ name, location, comment }) => {
  return (
    <>
      <div className="flex flex-col flex-shrink-0 border-1 border-gray-300/40 w-[98%] p-[25px]  h-[190px] lg:h-[260px] xl:h-[280px] lg:gap-5 rounded-xl hover:shadow-md transition-shadow duration-300 cursor-pointer my-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-[16px] font-bold  lg:text-[18px]">
              {name}
              <CheckCircleFilled className="!text-[#01AB31]" />
            </span>
            <span className="text-[14px] lg:text-[16px]">{location}</span>
          </div>
        </div>

        <div className="relative">
          <Rate disabled allowHalf defaultValue={3} />
        </div>

        <p className=" text-[14px] overflow-y-scroll hide-scrollbar lg:text-[18px] line-clamp-3 xl:line-clamp-none ">
          {comment}
        </p>
      </div>
    </>
  );
};

export default FeedbackCard;
