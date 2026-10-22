import { getToken } from '../lib/quote';

export function TokenIcon({
  mint,
  small = false,
}: {
  mint: string;
  small?: boolean;
}) {
  const token = getToken(mint);
  return (
    <span
      className={`token-icon ${small ? 'small' : ''} token-${token.symbol.toLowerCase()}`}
      style={{ '--token-color': token.tone } as React.CSSProperties}
      aria-hidden="true"
    >
      {token.symbol === 'SOL' ? (
        <span className="sol-bars">
          <i />
          <i />
          <i />
        </span>
      ) : token.symbol === 'USDC' ? (
        '$'
      ) : (
        token.symbol.slice(0, 1)
      )}
    </span>
  );
}
