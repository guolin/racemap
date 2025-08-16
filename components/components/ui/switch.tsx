import * as React from 'react';
import clsx from 'clsx';

export interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
	checked: boolean;
	onCheckedChange: (_checked: boolean) => void;
	id?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	({ checked, onCheckedChange, className, id, ...props }, ref) => {
		const isOn = !!checked;
		return (
			<button
				ref={ref}
				id={id}
				role="switch"
				aria-checked={isOn}
				onClick={() => onCheckedChange(!isOn)}
				className={clsx(
					'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
					isOn ? 'bg-primary' : 'bg-muted',
					className
				)}
				{...props}
			>
				<span
					className={clsx(
						'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
						isOn ? 'translate-x-5' : 'translate-x-1'
					)}
				/>
			</button>
		);
	}
);
Switch.displayName = 'Switch';

export default Switch; 