Open browser at any song page and paste following:

```js
function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key]
      return result
    }, {})
}

firestore
  .collection('songs')
  .get()
  .then((l) => {
    console.log(
      JSON.stringify(
        l.docs
          .map((d) => sortObject(d.data()))
          .sort((a, b) => (a.slug > b.slug ? 1 : -1)),
        null,
        2,
      ),
    )
  })

firestore
  .collection('collections')
  .get()
  .then((l) => {
    console.log(
      JSON.stringify(
        l.docs
          .map((d) => sortObject(d.data()))
          .sort((a, b) => (a.slug > b.slug ? 1 : -1)),
        null,
        2,
      ),
    )
  })
```
