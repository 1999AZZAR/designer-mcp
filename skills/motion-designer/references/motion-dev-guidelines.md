# Motion.dev Technical Guidelines

## React Integration (`motion/react`)

### Basic Spring Animations
```tsx
import { motion } from "motion/react"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
/>
```

### Micro-interactions
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click Me
</motion.button>
```

### Staggered Reveal
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } }
}

<motion.ul variants={container} initial="hidden" animate="show">
  <motion.li variants={item} />
  <motion.li variants={item} />
</motion.ul>
```

### Scroll Animations
```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
/>
```

## Vanilla JS (`motion`)
For non-React projects, import from `"motion"`.

```javascript
import { animate, stagger } from "motion"

animate(".box", 
  { y: [20, 0], opacity: [0, 1] }, 
  { 
    delay: stagger(0.1), 
    type: "spring", 
    bounce: 0.25 
  }
)
```
