// @ts-nocheck
const f = (a, b) => [].concat(...a.map((d) => b.map((e) => [].concat(d, e))))
const cartesian: any = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a)

export default cartesian
