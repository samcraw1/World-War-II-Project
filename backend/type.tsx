export type Post = {
    id: string 
    caption: string
    date: string

}
export type Comment = { 
    id: string
    postId: string
    content: string
    date: string
}

export type User = {
    id: string
    username: string
    email: string
    dateJoined: string
}

export type Like = {
    id: string
    postId: string
    userId: string
    date: string
}

export type Timeline = {
    id: string
    title: string
    story: string
    date: string
}