import { useEffect, useState } from "react";
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';
import Router from 'next/router';

const OrderShow = ({order, currentUser}) => {

    const {doRequest,errors} = useRequest(
        {url:'/api/payments/',
        method: 'post',
        body: {  orderId: order.id },
        onSuccess:  () => Router.push('/orders')
    });

    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const findTimeLeft = () => {
            const msLeft = new Date(order.expiresAt) - new Date();
            setTimeLeft(Math.round(msLeft/1000));
        };

        findTimeLeft();
        const timerId = setInterval(findTimeLeft, 1000);
        
        return () => {
            clearInterval(timerId);
        };

    },[order])
    let render;
    
    if(timeLeft<=0 && order.status!=='complete')
    {
        render =<h4>Order Expired</h4>;
    }
    else if(order.status==='complete')
    {
        render =<h4>Order Completed</h4>;
    }
    else if (timeLeft>0 && order.status==='created')
    {
        render= <><h4>You have {timeLeft} seconds left to order</h4>
        {errors}
        <StripeCheckout
            token={({id})=> doRequest({token: id})}
            stripeKey = "pk_test_51J9t84HJEAR2JwlR8Tsca7ZaAj7hdoTUU52fPyZYJI9nzbD1pLVl1gKPJkNwRlPKq9DSlOYX2lgzb12nDR3RDdmi00PIBkKoPx"
            amount={order.ticket.price *100}
            currency="brl"
            email={currentUser.email}
        /></>;
    }
        
    return (<div>
        <h1>Purschasing {order.ticket.title}</h1>
        {render}

    </div> )
}


OrderShow.getInitialProps  = async (context, client) => {
    const {orderId} = context.query;
    const {data} = await client.get(`/api/orders/${orderId}`);
    return {order: data}
    
}


export default OrderShow ;