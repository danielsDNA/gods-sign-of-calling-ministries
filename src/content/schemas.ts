import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "sermons": z.array(z.object({
        "id": z.string(),
        "title": z.string(),
        "series": z.string(),
        "speaker": z.string(),
        "date": z.string(),
        "scripture": z.string(),
        "image": z.string()
      })),
      "galleryImages": z.array(z.object({
        "slot": z.string(),
        "alt": z.string(),
        "tall": z.boolean(),
        "id": z.string()
      }))
    }),
    events: z.object({
      "categories": z.array(z.string())
    }),
    contact: z.object({
      "topics": z.array(z.string())
    }),
    gallery: z.object({
      "intro": z.string(),
      "categories": z.array(z.string()),
      "photos": z.array(z.object({
        "id": z.string(),
        "slot": z.string(),
        "alt": z.string(),
        "category": z.string(),
        "tall": z.boolean()
      }))
    }),
    ministries: z.object({
      "intro": z.string(),
      "scripture": z.object({
        "text": z.string(),
        "reference": z.string()
      }),
      "volunteerCta": z.object({
        "heading": z.string(),
        "body": z.string(),
        "buttonLabel": z.string(),
        "buttonHref": z.string()
      }),
      "ministries": z.array(z.object({
        "id": z.string(),
        "name": z.string(),
        "slug": z.string(),
        "description": z.string(),
        "imageSlot": z.string(),
        "leader": z.object({
          "name": z.string(),
          "title": z.string(),
          "photoSlot": z.string()
        }),
        "meetingDay": z.string(),
        "meetingTime": z.string(),
        "audience": z.string()
      }))
    }),
    sermons: z.object({
      "intro": z.string(),
      "sermons": z.array(z.object({
        "id": z.string(),
        "title": z.string(),
        "series": z.string(),
        "speaker": z.string(),
        "date": z.string(),
        "duration": z.string(),
        "scripture": z.string(),
        "description": z.string(),
        "image": z.string(),
        "videoUrl": z.string(),
        "audioUrl": z.string(),
        "tags": z.array(z.string())
      })),
      "series": z.array(z.object({
        "id": z.string(),
        "name": z.string()
      })),
      "speakers": z.array(z.object({
        "id": z.string(),
        "name": z.string()
      }))
    }),
    about: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "heading": z.string(),
        "subheading": z.string()
      }),
      "story": z.object({
        "heading": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }),
      "mission": z.object({
        "heading": z.string(),
        "statement": z.string(),
        "description": z.string(),
        "evangelism": z.string(),
        "evangelismReference": z.string(),
        "worship": z.string(),
        "worshipReference": z.string(),
        "discipleship": z.string(),
        "discipleshipReference": z.string(),
        "missions": z.string(),
        "missionsReference": z.string()
      }),
      "vision": z.object({
        "heading": z.string(),
        "statement": z.string(),
        "description": z.string()
      }),
      "values": z.array(z.object({
        "id": z.string(),
        "icon": z.string(),
        "title": z.string(),
        "description": z.string()
      })),
      "stats": z.array(z.object({
        "id": z.string(),
        "value": z.string(),
        "label": z.string()
      })),
      "team": z.array(z.object({
        "id": z.string(),
        "name": z.string(),
        "role": z.string(),
        "bio": z.string(),
        "image": z.string()
      })),
      "scripture": z.object({
        "text": z.string(),
        "reference": z.string()
      }),
      "cta": z.object({
        "heading": z.string(),
        "body": z.string()
      })
    })
  }
};
export type Schemas = typeof schemas;