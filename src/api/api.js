import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_STICKY_BASE,
    auth: {
        username: import.meta.env.VITE_STICKY_UNAME,
        password: import.meta.env.VITE_STICKY_PASSWD,
    },
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
});

export const getCustomer = async (email, zip) => {
    const req_body = {
        campaign_id: "all",
        start_date: "01/01/2020",
        end_date: "12/31/2025",
        criteria: {
            "zip": zip,
            "email": email
        },
        search_type: "all",
        return_type: "customer_view"
    };

    const { data } = await api.post("customer_find", req_body);
    if (data.response_code !== "100") throw new Error("API Error");

    if (parseInt(data.total_customers) != 1) {
        throw new Error("Please contact support");
    }

    const customerId = data.customer_ids;
    const customerData = data.data[customerId];
    const orderList = customerData.order_list.split(',');

    return {
        customer_id: customerId,
        order_count: parseInt(customerData.order_count),
        orders: orderList,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        email: customerData.email
    }
}

export const getOrderDetails = async (orderIds) => {
    const orderDetails = [];

    for (const orderId of orderIds) {
        try {
            const req_body = {
                order_id: [parseInt(orderId)],
                return_variants: 1
            };

            const { data } = await api.post("order_view", req_body);

            if (data.response_code === "100") {
                const processedOrder = {
                    order_id: data.order_id,
                    date: data.acquisition_date,
                    total: parseFloat(data.order_total || 0),
                    products: data.products?.map(product => ({
                        name: product.name || 'Unknown Product',
                        price: parseFloat(product.price || 0),
                        order_type: product.billing_model?.name || 'Unknown',
                        recurring_date: product.recurring_date,
                        next_billing_price: parseFloat(product.next_subscription_product_price || 0),
                        is_trial: product.is_in_trial === "1",
                        is_recurring: product.billing_model?.name?.toLowerCase().includes('subscription')
                    })) || []
                };
                orderDetails.push(processedOrder);
            }
        } catch (error) {
            console.error(`Failed to fetch order ${orderId}:`, error);
        }
    }

    return orderDetails;
};

export const getUpcomingSubscriptions = (orderDetails) => {
    const upcomingPayments = [];
    const today = new Date();

    orderDetails.forEach(order => {
        order.products.forEach(product => {
            if (product.is_recurring && product.recurring_date && product.recurring_date !== '0000-00-00') {
                const recurringDate = new Date(product.recurring_date);
                if (recurringDate > today) {
                    upcomingPayments.push({
                        product_name: product.name,
                        date: product.recurring_date,
                        amount: product.next_billing_price,
                        is_trial: product.is_trial
                    });
                }
            }
        });
    });

    return upcomingPayments.sort((a, b) => new Date(a.date) - new Date(b.date));
};

