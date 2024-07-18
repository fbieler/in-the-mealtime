import {IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import {formatMonetaryAmount} from "../../utils/moneyUtils.ts";
import {OrderPosition, OrderStateType} from "../../../build/generated-ts/api/api.ts";

export default function OrderPositionsTable({
                                              height,
                                              orderState,
                                              orderPositions,
                                              selectedPosition,
                                              onSelect,
                                              onDeselect,
                                              onDelete
                                            }: {
  height: number,
  orderState: OrderStateType,
  orderPositions: OrderPosition[],
  selectedPosition: OrderPosition | null,
  onSelect: (pos: OrderPosition) => void,
  onDeselect: () => void,
  onDelete: (pos: OrderPosition) => void,
}) {
  return <TableContainer component={Paper}
                         sx={{
                           minHeight: '240px',
                           height: `${height}px`,
                           maxHeight: `${height}px`,
                           border: '1px solid lightgray'
                         }}>
    <Table size="small" stickyHeader={true}>
      <TableHead>
        <TableRow>
          <TableCell align="left" style={{width: '2%', fontWeight: 'bold'}}></TableCell>
          <TableCell align="left" style={{width: '3%', fontWeight: 'bold'}}>#</TableCell>
          <TableCell align="left" style={{width: '10%', fontWeight: 'bold'}}>Name</TableCell>
          <TableCell align="left" style={{width: '35%', fontWeight: 'bold'}}>Gericht</TableCell>
          <TableCell align="right" style={{width: '10%', fontWeight: 'bold'}}>Preis</TableCell>
          <TableCell align="right" style={{width: '10%', fontWeight: 'bold'}}>Bezahlt</TableCell>
          <TableCell align="right" style={{width: '10%', fontWeight: 'bold'}}>Trinkgeld</TableCell>
          <TableCell align="right" style={{width: '10%', fontWeight: 'bold'}}>Rückgeld</TableCell>
          <TableCell align="right" style={{width: '10%', fontWeight: 'bold'}}/>
        </TableRow>
      </TableHead>

      <TableBody>
        {
          orderPositions.map((line, idx) => {
            return <OrderTableRow key={line.id}
                                  orderState={orderState}
                                  idx={idx}
                                  selected={line.id === selectedPosition?.id}
                                  position={line}
                                  onSelect={onSelect}
                                  onDeselect={onDeselect}
                                  onDelete={onDelete}
            />;
          })
        }
      </TableBody>
    </Table>
  </TableContainer>;
}

function OrderTableRow({idx, position, orderState, selected, onSelect, onDeselect, onDelete}: {
  idx: number,
  position: OrderPosition,
  orderState: OrderStateType,
  selected: boolean,
  onSelect: (pos: OrderPosition) => void
  onDeselect: () => void
  onDelete: (pos: OrderPosition) => void
}) {
  const isPaid = position.price + (position.tip ?? 0) <= (position.paid ?? 0);

  const returnMoney = isPaid ? (position.paid ?? 0) - position.price - (position.tip ?? 0) : null;

  const isEditable = orderState === OrderStateType.New || orderState === OrderStateType.Open
    || (!isPaid && (
      orderState === OrderStateType.Locked
      || orderState === OrderStateType.Ordered
    ));

  const isDeletable = orderState === OrderStateType.New || orderState === OrderStateType.Open;

  return <TableRow selected={selected}>
    <TableCell align="left" color="text.secondary">
      {idx + 1}
    </TableCell>

    <TableCell align="left" color="text.secondary">
      {
        selected
          ? <EditIcon color="warning" fontSize="small"/>
          : (position.index + 1)
      }
    </TableCell>
    <TableCell align="left">
      {position.name}
    </TableCell>
    <TableCell align="left">
      {position.meal}
    </TableCell>
    <TableCell align="right">
      {formatMonetaryAmount(position.price)}
    </TableCell>
    <TableCell align="right">
      {formatMonetaryAmount(position.paid)}
    </TableCell>
    <TableCell align="right">
      {formatMonetaryAmount(position.tip)}
    </TableCell>
    <TableCell align="right">
      {formatMonetaryAmount(returnMoney)}
    </TableCell>

    <TableCell align="right">
      {isEditable && !selected &&
        <IconButton size="small"
                    color="primary"
                    disabled={selected}
                    onClick={() => onSelect(position)}>
          <EditIcon fontSize="inherit"/>
        </IconButton>
      }
      {isEditable && selected &&
        <IconButton size="small"
                    color="warning"
                    disabled={!selected}
                    onClick={() => onDeselect()}>
          <UndoIcon fontSize="inherit"/>
        </IconButton>
      }

      {isDeletable &&
        <IconButton size="small"
                    color="error"
                    disabled={selected}
                    onClick={() => onDelete(position)}>
          <DeleteIcon fontSize="inherit"/>
        </IconButton>
      }
    </TableCell>
  </TableRow>
}
