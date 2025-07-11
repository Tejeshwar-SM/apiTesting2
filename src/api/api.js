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
    //take in the fields and send the request to customer_view to get the customer_id and orderlist
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


