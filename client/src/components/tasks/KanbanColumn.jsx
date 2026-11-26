import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import Button from '../common/Button';
import ErrorState from '../common/ErrorState';
import Icon from '../common/Icon';
import { CardSkeleton } from '../common/Skeleton';
import { STATUS_LABELS } from '../../utils/constants';

export const STATUS_DOT = { todo: 'bg-slate-400', in_progress: 'bg-indigo-500', done: 'bg-emerald-500' };

export default function KanbanColumn({ status, column, boardId, onMove, onLoadMore, onRetry, onAdd, dragDisabled, className = '' }) {
  const { items, meta, loading, error } = column;
  return (
    <section className={`min-w-0 flex-col rounded-2xl bg-sunken/80 p-2 ${className}`} aria-label={STATUS_LABELS[status]}>
      <header className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
          {STATUS_LABELS[status]}
          <span className="rounded-full border border-line bg-white px-1.5 text-[11px] font-semibold tabular-nums text-slate-500">{meta ? meta.total : '–'}</span>
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(status)}
            className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-ink"
            aria-label={`Add task to ${STATUS_LABELS[status]}`}
          >
            <Icon name="plus" />
          </button>
        )}
      </header>

      {error ? (
        <ErrorState compact title="Could not load tasks" message={error.message} onRetry={() => onRetry(status)} />
      ) : loading ? (
        <div className="space-y-2">
          <CardSkeleton count={3} />
        </div>
      ) : (
        <Droppable droppableId={status} isDropDisabled={dragDisabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex min-h-28 flex-1 flex-col gap-2 rounded-xl p-0.5 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}
            >
              {items.map((task, index) => (
                <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={dragDisabled}>
                  {(drag, dragSnap) => (
                    <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                      <TaskCard task={task} boardId={boardId} onMove={onMove} dragging={dragSnap.isDragging} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {!items.length && !snapshot.isDraggingOver && (
                <p className="rounded-xl border border-dashed border-slate-300 px-2 py-6 text-center text-xs text-slate-400">No tasks here</p>
              )}
            </div>
          )}
        </Droppable>
      )}

      {meta?.hasNext && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onLoadMore(status)}>
          Load more ({meta.total - items.length} left)
        </Button>
      )}
      {onAdd && !loading && !error && (
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-white hover:text-indigo-600"
        >
          <Icon name="plus" className="h-3.5 w-3.5" /> Add task
        </button>
      )}
    </section>
  );
}
