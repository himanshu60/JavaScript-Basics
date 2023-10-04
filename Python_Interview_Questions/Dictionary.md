# Dictionary

- Python dictionary is an **ordered collection of items**.
- As of Python version 3.7, dictionaries are *ordered*. In Python 3.6 and earlier, dictionaries are *unordered*.
- Dictionaries are **optimized to retrieve values when the key is known.**
- A dictionary is a collection that is **changeable** and **does not allow duplicates**.
- Dictionaries are written **with curly brackets** and **have keys and values.**
- Holds data as `**key-value**` pair
- No concept of an index system and hence they are unordered.
- To fetch the data we use keys.
- A dictionary can’t have two keys with the same name. [ **keys must be unique and values can repeat**]
- Dictionaries are mutable, so we can
    - add a new key-value pair
    - replace the value not a key
    - delete a key-value pair
- **Syntax**➖
dict={
	"key1": value,
	"key2": "value",
}
<!-- ---------------------------------------------------------------------------------------------------------- -->
d={
  'name':["Anny", "Bunny", "Danny", "Enav"],
  'age':[25,36,22,12],
  'income':[90,75,80,93]
}
print(d['name']) # ['Anny', 'Bunny', 'Danny', 'Enav']
print(len(d['name']))   # 4
print(d['name'][len(d['name'])-1])  # Enav
print(d['name'][len(d['name'])-1]," - ",d['age'][len(d['age'])-1]) # Enav  -  12

# For Loop
for i in range(len(d['name'])):
	print("Name -",d['name'][i],"Age -",d['age'][i],"Income(lakhs) -",d['age'][i])

'''
OUTPUT => 
Name - Anny Age - 25 Income(lakhs) - 25
Name - Bunny Age - 36 Income(lakhs) - 36
Name - Danny Age - 22 Income(lakhs) - 22
Name - Enav Age - 12 Income(lakhs) - 12
'''