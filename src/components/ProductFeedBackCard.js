import { Rate } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

function formatPostedDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString(undefined, options);
  return `Posted on ${formattedDate}`;
}

const ProductFeedBackCard = ({ name, rating, comment, date }) => {
  return (
    <>
      <div className="flex flex-col flex-shrink-0 border-1 border-gray-300/40 w-[98%] p-[25px]  h-[224px] lg:h-[260px] xl:h-[280px] lg:gap-5 rounded-[26px] hover:shadow-md transition-shadow duration-300 cursor-pointer justify-between">
        <div>
          <div className="relative">
            <Rate disabled allowHalf defaultValue={Number(rating) || 0} />
          </div>
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-[18px] font-bold  lg:text-[20px]">
                {name}
                <CheckCircleFilled className="!text-[#01AB31]" />
              </span>
            </div>
          </div>
        </div>

        <p className="text-black/60 text-[16px] overflow-y-scroll hide-scrollbar lg:text-[18px] line-clamp-3 xl:line-clamp-none ">
          "{comment}"
        </p>
        <p className="text-black/60 text-[16px] lg:text-[18px] font-medium">
          {formatPostedDate(date)}
        </p>
      </div>
    </>
  );
};

export default ProductFeedBackCard;
