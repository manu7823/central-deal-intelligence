import cn from 'classnames';

interface InputElementProps {
  label: string;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const InputElement = ({
  label,
  children,
  fullWidth = false
}: InputElementProps) => {
  return (
    <div className={cn(fullWidth ? 'col-span-full' : 'sm:col-span-3')}>
      <p className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </p>
      <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="card flex justify-content-center w-100 col-span-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InputElement;
