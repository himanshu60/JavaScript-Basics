Indexing in MongoDB is a way to optimize the performance of a database by minimizing the amount of data that mongoDB needs to scan when executing queries.
# Example:-
If you have a collection with a million documents and you need to find a document where the "name" field is "john",without an index in mongoDB would need to scan all one million documents. But if you have an index on the "name" field, MongoDB can use that index to limit the number of documents it needs to scan, significantly improving the query's execution time.


# Indexing:

Think of indexing like the table of contents in a book. When you want to find something in a book, you don't read the whole book from start to finish. Instead, you look at the table of contents to find the page numbers where specific topics are mentioned. That table of contents is like an index—it helps you quickly locate information in the book.

In databases, indexing works similarly. It's like creating a table of contents for your data. When you want to find specific data in a large collection, an index helps the database quickly locate where that data is stored, just like flipping to the right page in a book. This makes searching for data much faster.

One-to-One Relationship:

Imagine you have two friends, Alice and Bob. Alice has a diary, and Bob also has a diary. Each of them writes their own secrets and thoughts in their diaries. They don't share their diaries with each other.

In this scenario, Alice's diary is like one piece of data, and Bob's diary is another piece of data. There is no connection or sharing of diaries between them. This is similar to a "one-to-one relationship" in databases.

In a database, a one-to-one relationship means that one piece of data in one table is related to one and only one piece of data in another table, just like Alice's diary is related only to Alice, and Bob's diary is related only to Bob. It's a way to organize data where each piece has a unique and separate partner in another table.