import { ShoppingCartOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useCartContext } from "@/components/CartContext";

const CartIcon = ({ className = "!text-2xl" }) => {
  const { cart } = useCartContext();

  // Calculate total quantity of products in the cart
  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Badge count={totalCount} size="small" offset={[3, -2]} color="red">
      <ShoppingCartOutlined
        className={`cursor-pointer ${className}`}
        style={{ fontSize: "1.8em" }}
      />
    </Badge>
  );
};

export default CartIcon;
