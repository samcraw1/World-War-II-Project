export function Toast({ message }: { message: string | null }) {
  return (
    <div className="toast" role="status" hidden={message === null}>
      {message}
    </div>
  );
}
