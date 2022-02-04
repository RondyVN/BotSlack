
export const getPriceOrder = (orders, dishes) => {
    let price = 0;
    orders.map(order => price += dishes[order.value]['price'])
    return price
}