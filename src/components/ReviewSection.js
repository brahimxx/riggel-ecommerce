import FeedbackCard from "./FeedbackCard";
import MyCarousel from "./MyCarousel";

const ReviewSection = () => {
  const feedbackItems = [
    <FeedbackCard
      key="1"
      name="Emily Johnson"
      location="USA, California"
      comment="Damien's photography doesn't just capture moments; it captures emotions. His work is simply mesmerizing."
    />,
    <FeedbackCard
      key="2"
      name="John Smith"
      location="USA, California"
      comment="Damien has an incredible talent for making every event feel effortless, and the results speak for themselves."
    />,
    <FeedbackCard
      key="3"
      name="Samantha Davis"
      location="USA, California"
      comment="I was blown away by Damien's ability to capture the essence of our wedding day. His photographs are our cherished memories."
    />,
    <FeedbackCard
      key="4"
      name="Samantha Davis"
      location="USA, California"
      comment="I was blown away by Damien's ability to capture the essence of our wedding day. His photographs are our cherished memories."
    />,
  ];

  return (
    <>
      <div className="flex flex-col py-[80px] max-w-screen-2xl mx-auto gap-10">
        <h2 className="self-center font-integral leading-none text-[48px] font-extrabold">
          Our happy Customers
        </h2>

        <MyCarousel items={feedbackItems} />
      </div>
    </>
  );
};

export default ReviewSection;
