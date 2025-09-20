import { Rate } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const FeedbackCard = ({ name, location, comment }) => {
  return (
    <>
      <div className="flex flex-col flex-shrink-0 border-1 border-gray-300/40 w-[98%]  p-[25px] h-[250px] gap-5 rounded-xl bg-cover bg-no-repeat bg-center hover:shadow-md transition-shadow duration-300 cursor-pointer my-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-[18px] font-bold text-grey/90 lg:text-[18px]">
              {name}
              <CheckCircleFilled className="!text-[#01AB31]" />
            </span>
            <span className=" text-grey/40 lg:text-[16px]">{location}</span>
          </div>
        </div>

        <div className="relative">
          <Rate disabled allowHalf defaultValue={3} />
        </div>

        <p className=" text-grey/90 text-[16px] overflow-y-scroll hide-scrollbar lg:text-[18px]">
          {comment}
        </p>
      </div>
    </>
  );
};

export default FeedbackCard;
