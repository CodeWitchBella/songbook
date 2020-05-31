Open browser at any song page and paste following:

```js
firestore
  .collection('songs')
  .get()
  .then((l) => {
    console.log(
      JSON.stringify(
        l.docs.map((d) => d.data()),
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
        l.docs.map((d) => d.data()),
        null,
        2,
      ),
    )
  })
```
