import {Order, OrderInfosPatch} from "../../../build/generated-ts/api";
import {Link, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {debounce} from 'lodash';
import {useCallback, useEffect, useMemo, useState} from "react";
import {DateTime} from "luxon";
import {TimeField} from "@mui/x-date-pickers";
import {OrderMoneyCollectionType} from "../../../build/generated-ts/api/api.ts";
import {useApiAccess} from "../../utils/ApiAccessContext.tsx";
import {assertNever} from "../../utils/utils.ts";
import {useNotification} from "../../utils/NotificationContext.tsx";

export default function OrderInfosView({order, onUpdateInfos}: { order: Order, onUpdateInfos: () => void, }) {
  const {orderApi} = useApiAccess();
  const {notifyError} = useNotification();

  const [touched, setTouched] = useState(false);

  const [orderer, setOrderer] = useState('');
  const [fetcher, setFetcher] = useState('');
  const [collectorType, setCollectorType] = useState<OrderMoneyCollectionType>(OrderMoneyCollectionType.Bar);
  const [collector, setCollector] = useState('');
  const [orderClosingTime, setOrderClosingTime] = useState<DateTime | null>(DateTime.fromISO('11:30'));

  const [orderText, setOrderText] = useState('');
  const [maximumMeals, setMaximumMeals] = useState('');

  useEffect(() => {
    setOrderer(order.infos.orderer ?? '')
    setFetcher(order.infos.fetcher ?? '')
    setCollectorType(order.infos.moneyCollectionType ?? OrderMoneyCollectionType.Bar)
    setCollector(order.infos.moneyCollector ?? '')
    setOrderClosingTime(order.infos.orderClosingTime ? DateTime.fromISO(order.infos.orderClosingTime) : DateTime.fromISO('11:30'))
    setOrderText(order.infos.orderText ?? '')
    setMaximumMeals(order.infos.maximumMealCount?.toString() ?? '')
  }, [order.infos.orderer, order.infos.fetcher, order.infos.moneyCollectionType, order.infos.moneyCollector, order.infos.orderClosingTime, order.infos.orderText, order.infos.maximumMealCount]);

  const isValid = useMemo(() => {
    if (!maximumMeals)
      return true;

    const parsed = Number.parseInt(maximumMeals)
    if (Number.isNaN(parsed))
      return false

    return 1 < parsed && order.orderPositions.length <= parsed;
  }, [maximumMeals, order.orderPositions.length]);

  const onUpdate = useCallback(debounce((infos: OrderInfosPatch) => {
    orderApi.setOrderInfo(order.id, infos)
      .then(() => onUpdateInfos())
      .then(() => setTouched(false))
      .catch(e => notifyError("Infos konnten nicht gespeichert werden", e))
  }, 2000), [order.id, onUpdateInfos, orderApi, notifyError])

  useEffect(() => {
    if (!touched || !isValid)
      return

    onUpdate({
      orderer: orderer,
      fetcher: fetcher,
      moneyCollectionType: collectorType,
      moneyCollector: collector,
      orderClosingTime: orderClosingTime?.toLocaleString(DateTime.TIME_24_WITH_SECONDS),
      orderText: orderText,
      maximumMealCount: Number.parseInt(maximumMeals),
    } as OrderInfosPatch)
  }, [isValid, touched, orderer, fetcher, collector, collectorType, orderClosingTime, orderText, maximumMeals, onUpdate]);

  const onChange = () => setTouched(true);

  const paypalLink = useMemo(() => {
    switch (collectorType) {
      case OrderMoneyCollectionType.Bar:
        return null;

      case OrderMoneyCollectionType.PayPal: {
        if (!collector)
          return null;

        if (collector.toLowerCase().startsWith("http"))
          return collector;
        else
          return "http://" + collector;
      }

      default:
        throw assertNever(collectorType);
    }
  }, [collector, collectorType]);

  useEffect(() => {
    if (collector.toLowerCase().includes("paypal"))
      setCollectorType(OrderMoneyCollectionType.PayPal)
  }, [collector]);

  return <Stack direction="column" spacing={2} justifyContent="flex-start" alignItems="center">
    <Typography variant="h6">
      Infos {touched && '*'}
    </Typography>

    <Stack spacing={2} alignItems="center">
      <TextField id="order-info-orderer"
                 size="small"
                 label="Wer bestellt?"
                 value={orderer}
                 onChange={e => {
                   setOrderer(e.target.value)
                   onChange();
                 }}
                 error={!orderer}
      />
      <TextField id="order-info-fetcher"
                 size="small"
                 label="Wer holt ab?"
                 value={fetcher}
                 onChange={e => {
                   setFetcher(e.target.value)
                   onChange();
                 }}
                 error={!fetcher}
      />

      <TextField id="order-info-money-collector"
                 size="small"
                 label="Geld wohin?"
                 value={collector}
                 onChange={e => {
                   setCollector(e.target.value)
                   onChange();
                 }}
                 helperText={
                   paypalLink
                     ? <Link target="_blank"
                             rel="noopener noreferrer"
                             href={paypalLink}>
                       {collector}
                     </Link>
                     : undefined
                 }
                 error={!collector}/>

      <ToggleButtonGroup id="order-info-money-collection-type"
                         size="small"
                         exclusive={true}
                         value={collectorType}
                         onChange={(_, val) => val !== null && setCollectorType(val)}>
        {
          Object.keys(OrderMoneyCollectionType)
            .map(key => {
              return <ToggleButton key={key}
                                   value={key}
                                   id={`order-info-money-collection-type-${key}`}>
                {key}
              </ToggleButton>
            })
        }
      </ToggleButtonGroup>

      <TimeField id="order-info-closing-time"
                 size="small"
                 ampm={false}
                 label="Bestellschluss"
                 value={orderClosingTime}
                 slotProps={{
                   textField: {
                     error: !orderClosingTime || !orderClosingTime.isValid
                   }
                 }}
                 onChange={e => {
                   setOrderClosingTime(e)
                   onChange();
                 }}/>

      <TextField id="order-info-maximum-meals"
                 size="small"
                 type="number"
                 label="Limitierung Gerichte"
                 value={maximumMeals}
                 onChange={e => {
                   setMaximumMeals(e.target.value)
                   onChange();
                 }}
                 error={!isValid}/>

      <TextField id="order-info-additional-text"
                 size="small"
                 sx={{width: '100%'}}
                 label="Zusatztext"
                 multiline={true}
                 maxRows={3}
                 value={orderText}
                 onChange={e => {
                   setOrderText(e.target.value)
                   onChange();
                 }}/>
    </Stack>
  </Stack>;
}
