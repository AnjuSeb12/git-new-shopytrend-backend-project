import Stripe from "stripe";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js"
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
import User from "../models/userModel.js";






const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const orderAdding = async (req, res) => {
    try {
        console.log("hittedhhhadding order")
        console.log("Received request to add order");

        const userId = req.user.id;
        console.log(req.body.orderItems)
        const { orderItems, shippingAddress } = req.body;

        if (!orderItems || !shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Order items and shipping address are required.',
            });
        }

        for (const item of orderItems) {
            if (!item.productId || !item.title || !item.quantity || !item.price || !item.totalPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Order item fields are missing.',
                });
            }
        }

        const totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0) * 100;

        const order = new Order({
            user: userId,
            orderItems,
            shippingAddress,
        });

        const newOrder = await order.save();


        if (!newOrder) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create order.',
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'usd',
            metadata: { orderId: newOrder._id.toString() },
        });
        await Cart.deleteMany({ user: userId });

        res.status(201).json({
            success: true,
            order: newOrder,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};
export const verifyPayment = async (req, res) => {
    console.log("verification hitted");
    console.log(req.body);

    const userId = req.user.id;
    const { paymentIntentId } = req.body;

    try {

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === "succeeded") {

            const orderId = paymentIntent.metadata.orderId;
            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            // update stock
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
            }


            const payment = new Payment({
                stripePaymentIntentId: paymentIntentId,
                paymentStatus: "Paid",
                order: orderId,
                user: userId,
            });

            await payment.save();

            await Order.findByIdAndUpdate(orderId, { paymentStatus: "Paid" });

            res.json({ message: "Payment verified successfully" });
        } else {
            res.status(400).json({ message: "Payment not successful" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

//correct code
export const cancelOrder = async (req, res) => {
    try {
        console.log("hitted")
        console.log(req.user.id)
        const userId = req.user.id;
        console.log(req.params.orderId)
        const orderId = req.params.orderId;
        if (!orderId || !userId) {
            return res.status(400).json({ error: 'Invalid orderId or userId' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });
        console.log('Order found:', order);

        if (order) {
            order.paymentStatus = 'Canceled';
            await order.save();


            res.json({ message: 'Order canceled successfully' });
        } else {
            res.status(404).json({ error: 'Order not found or not authorized to cancel this order' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error canceling order' });
    }
};

// cancel Payment
export const cancelPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Restore stock for each item in the order
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } }
            );
        }

        await Order.findByIdAndUpdate(orderId, { paymentStatus: "Canceled" });

        res.json({ message: "Order canceled and stock restored" });
    } catch (error) {
        console.error("Error canceling order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const orderUser = async (req, res) => {
    try {

        console.log("hitt")
        const user = req.user.id;
        const orders = await Order.find({ user });
        res.json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);

        res.status(500).json({ error: 'Error fetching orders' });
    }
};




export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'firstName lastName email')
            .populate({
                path: 'orderItems.productId',
                select: 'title image', 
            });
            console.log('Fetched Orders:', orders);

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Orders not found!",
            });
        }

        const ordersWithPaymentStatus = await Promise.all(orders.map(async (order) => {
            let paymentStatus = 'Pending';  // Default status

            if (order.paymentStatus === 'Canceled') {
                paymentStatus = 'Canceled';
            } else {
                const payment = await Payment.findOne({ order: order._id });
                if (payment) {
                    paymentStatus = payment.paymentStatus;
                }
            }

            return {
                ...order.toObject(),
                paymentStatus,
            };
        }));

        res.status(200).json({
            success: true,
            orders: ordersWithPaymentStatus,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





export const orderViewById = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;

    try {
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('user')
            .populate('orderItems.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const orderDelete = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id; 

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ error: 'Order not found or not authorized to delete this order' });
        }

        
        await Order.deleteOne({ _id: orderId });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Error deleting order' });
    }
};



