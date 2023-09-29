export const measure = (label: string) => {
  performance.mark(label)
  return {
    end: () => {
      performance.mark(label + '-end')
      performance.measure(label, label, label + '-end')
    },
  }
}

export const printMeasure = () => {
  console.clear()
  console.table(
    performance
      .getEntriesByType('measure')
      .map((entry) => ({
        name: entry.name,
        duration: entry.duration.toFixed(3) + 'ms',
      }))
      .sort((a, b) => (a.name > b.name ? -1 : 1)),
  )

  performance.clearMarks()
  performance.clearMeasures()
}
