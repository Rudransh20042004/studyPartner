import { motion } from 'framer-motion';

export default function AnimatedButton(props) {
	// forward all props to underlying button element
	const { className = '', children, ...rest } = props;
	return (
		<motion.button
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98, x: [0, 1, -1, 1, 0] }}
			transition={{ duration: 0.12 }}
			className={className}
			{...rest}
		>
			{children}
		</motion.button>
	);
}


