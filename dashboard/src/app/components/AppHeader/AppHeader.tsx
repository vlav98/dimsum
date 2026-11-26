import type { User } from '../../../types/dashboard';

export default function AppHeader({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <a className="brand" href="#/">
        DIMSUM <span>CONTROL PANEL</span>
      </a>
      <div className="account">
        {user.avatar ? (
          <img
            className="avatar"
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=96`}
            alt=""
          />
        ) : (
          <span className="avatar avatar-fallback" aria-hidden="true">
            {user.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="account-name">{user.displayName}</span>
        <button className="text-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
