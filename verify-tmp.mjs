import { arcBand, wedge, circle, ring } from './src/engine/symbols/shapes.ts'
import { bounds } from './src/engine/symbols/pen.ts'
// A full-sweep band should measure like a ring; a quarter should be a quarter.
console.log('full band  ', bounds(arcBand(50,50,40,8,0,360)))
console.log('ring       ', bounds(ring(50,50,40,8)))
console.log('quarter 0-90', bounds(arcBand(50,50,40,8,0,90)))
console.log('wedge 0-90 ', bounds(wedge(50,50,40,0,90)))
console.log('half 0-180 ', bounds(arcBand(50,50,40,8,0,180)))
