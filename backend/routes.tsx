import express from 'express';
import { db } from './db';
import { currentWarDate } from './warDate';


const router = express.Router();


router.get('/timeline/today', async (request, response) => {
    try {
        const { rows: [getToday] } = await db.query(
            'SELECT id, title, story, date FROM timeline WHERE date = $1 LIMIT 1',
            [currentWarDate()]
        );

        if(!getToday) {
            return response.status(404).json({ message: 'Nothing recorded for today' });
        }

        response.json(getToday);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/timeline/:date', async (request, response) => {
    try {
        const { date } = request.params;

        if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
            return response.status(400).json({ message: 'Date must be YYYY-MM-DD' });
        }

        // Days that haven't happened yet in the real-time replay stay hidden.
        if(date > currentWarDate()) {
            return response.status(404).json({ message: 'Nothing recorded for that day' });
        }

        const { rows: [getDay] } = await db.query(
            'SELECT id, title, story, date FROM timeline WHERE date = $1 LIMIT 1',
            [date]
        );

        if(!getDay) {
            return response.status(404).json({ message: 'Nothing recorded for that day' });
        }

        response.json(getDay);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/posts', async (request, response) => {
    try {
        const { rows: getPosts } = await db.query(
            'SELECT id, caption, date FROM posts ORDER BY date DESC'
        );

        if(!getPosts || getPosts.length === 0) {
            return response.status(404).json({ message: 'No posts found' });
        }

        response.json(getPosts);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/post/:id', async (request, response) => {
    try {
        const { rows: [getPostId] } = await db.query(
            'SELECT id, caption, date FROM posts WHERE id = $1',
            [request.params.id]
        );

        if(!getPostId) {
            return response.status(404).json({ message: 'Post not found' });
        }

        response.json(getPostId);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/user/:id/comments', async (request, response) => {
    try {
        const { rows: getUserComments } = await db.query(
            'SELECT id, post_id AS "postId", content, date FROM comments WHERE user_id = $1 ORDER BY date DESC',
            [request.params.id]
        );

        if(!getUserComments || getUserComments.length === 0) {
            return response.status(404).json({ message: 'No comments found for this user' });
        }

        response.json(getUserComments);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/comments/:commentId', async (request, response) => {
    try {
        const deleteComment = (await db.query(
            'DELETE FROM comments WHERE id = $1',
            [request.params.commentId]
        )).rowCount;

        if(!deleteComment) {
            return response.status(404).json({ message: 'Comment not found' });
        }

        response.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/posts/:postId/like', async (request, response) => {
    try {
        const likePost = (await db.query(
            `INSERT INTO likes (id, post_id, user_id, date)
             SELECT gen_random_uuid(), p.id, $2, NOW() FROM posts p WHERE p.id = $1`,
            [request.params.postId, request.body.userId]
        )).rowCount;

        if(!likePost) {
            return response.status(404).json({ message: 'Post not found' });
        }

        response.json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/posts/:postId/like', async (request, response) => {
    try {
        const unlikePost = (await db.query(
            'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
            [request.params.postId, request.body.userId]
        )).rowCount;

        if(!unlikePost) {
            return response.status(404).json({ message: 'Post not found' });
        }

        response.json({ message: 'Post unliked successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/users/:userId', async (request, response) => {
    try {
        const { rows: [getUser] } = await db.query(
            'SELECT id, username, email, date_joined AS "dateJoined" FROM users WHERE id = $1',
            [request.params.userId]
        );

        if(!getUser) {
            return response.status(404).json({ message: 'User not found' });
        }

        response.json(getUser);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/me', async (request, response) => {
    try {
        const { rows: [updateUser] } = await db.query(
            `UPDATE users
             SET username = COALESCE($2, username), email = COALESCE($3, email)
             WHERE id = $1
             RETURNING id, username, email, date_joined AS "dateJoined"`,
            [request.body.id, request.body.username, request.body.email]
        );

        if(!updateUser) {
            return response.status(404).json({ message: 'User not found' });
        }

        response.json(updateUser);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/timeline/:date', async (request, response) => {
    try {
        const { rows: [getTimelineEvent] } = await db.query(
            'SELECT id, title, story, date FROM timeline WHERE date = $1',
            [request.params.date]
        );

        if(!getTimelineEvent){
            return response.status(404).json({ message: 'Timeline event not found' });
        }

        response.json(getTimelineEvent);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal server error' });
    }
}); 


export default router;
