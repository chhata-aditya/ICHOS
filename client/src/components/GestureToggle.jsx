import usePlayer from '../hooks/usePlayer';
import GestureController from './GestureController';
import './GestureToggle.css';

function GestureToggle() {
  const { gestureMode, toggleGestureMode } = usePlayer();

  return (
    <div className="gesture-toggle">
      <div className="gesture-toggle__row">
        <span className="gesture-toggle__label">Gesture Control</span>
        <button
          type="button"
          className={`gesture-toggle__switch${gestureMode ? ' is-on' : ''}`}
          role="switch"
          aria-checked={gestureMode}
          onClick={toggleGestureMode}
        >
          <span className="gesture-toggle__knob" />
          <span className="gesture-toggle__text">{gestureMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>
      <p className="gesture-toggle__hint">
        {gestureMode
          ? 'Camera is active only while this switch is on.'
          : 'Gesture mode is OFF. The camera will not be used.'}
      </p>
      <GestureController />
    </div>
  );
}

export default GestureToggle;
