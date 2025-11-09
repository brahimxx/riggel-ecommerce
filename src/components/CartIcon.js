import { ShoppingCartOutlined, ShoppingOutlined } from "@ant-design/icons";
import Link from "next/link";
import { Badge } from "antd";
import { useCartContext } from "@/components/CartContext";
import { Popover } from "antd";
import CartProductCard from "@/components/CartProductCard";

const CartIcon = ({ className = "!text-2xl" }) => {
  const { cart, updateQuantity, removeFromCart } = useCartContext();

  const subtotal = cart.items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const title = (
    <>
      <ShoppingOutlined /> Shopping Cart ({totalItems} items)
    </>
  );

  const content = (
    <div
      className="flex flex-col min-w-[300px] 
      h-[60vh] overflow-auto"
    >
      <div className="px-4 ">
        <div className="flex flex-col w-full">
          {cart.items.length > 0 ? (
            <>
              {cart.items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variantId || ""}`}
                  className={`${
                    index !== cart.items.length - 1
                      ? "border-b border-gray-300/60"
                      : ""
                  }`}
                >
                  <CartProductCard
                    product={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    compact // optionally pass a prop to render compact version
                  />
                </div>
              ))}
              <div className="py-2 px-4 bg-white sticky bottom-0 left-0 z-10">
                <div className="flex justify-between font-bold mb-2">
                  <span>Subtotal:</span>
                  <span>${subtotal}</span>
                </div>
                <Link
                  href="/cart"
                  className="bg-black text-white rounded-full py-2 text-sm text-center block hover:bg-black/90 transition"
                  scroll={false}
                >
                  View Cart / Checkout
                </Link>
              </div>
            </>
          ) : (
            <p className="py-8 text-center">Your shopping cart is empty.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Popover placement="bottomRight" title={title} content={content}>
      <Badge count={totalItems} size="small" offset={[3, -2]} color="red">
        <ShoppingCartOutlined
          className={`cursor-pointer ${className}`}
          style={{ fontSize: "1.8em" }}
        />
      </Badge>
    </Popover>
  );
};

export default CartIcon;
