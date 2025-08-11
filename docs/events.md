# Custom Meta Pixel Events

## Event Categories

### Primary Lead Classification Events (8 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_prnt_event_{env}` | Page 1 completion | Parent filled form AND not spam |
| `adm_qualfd_prnt_{env}` | Page 1 completion | Parent filled \+ qualified (BCH/LUM-L1/LUM-L2) \+ not spam |
| `adm_disqualfd_prnt_{env}` | Page 1 completion | Parent filled \+ not qualified \+ not spam |
| `adm_spam_prnt_{env}` | Page 1 completion | Parent filled \+ spam detected (GPA=10 OR percentage=100) |
| `adm_spam_stdnt_{env}` | Page 1 completion | Student filled \+ spam detected |
| `adm_stdnt_{env}` | Page 1 completion | Student filled form |
| `adm_qualfd_stdnt_{env}` | Page 1 completion | Student filled \+ would qualify as parent |
| `adm_disqualfd_stdnt_{env}` | Page 1 completion | Student filled \+ would not qualify as parent OR spam |

### General Funnel Events (7 events)

| Event Name | Trigger | Description |
| :---- | :---- | :---- |
| `adm_page_view_{env}` | Component mount/step change | Page view tracking |
| `adm_cta_hero_{env}` | Hero CTA button click | Landing page hero section CTA |
| `adm_cta_header_{env}` | Header CTA button click | Header "Request Evaluation" button |
| `adm_page_1_continue_{env}` | Page 1 submission | User clicks continue on Page 1 |
| `adm_page_2_view_{env}` | Page 2 load | User reaches Page 2 |
| `adm_page_2_submit_{env}` | Page 2 submission | User submits Page 2 |
| `adm_form_complete_{env}` | Form completion | Entire form process completed |

### BCH Lead Specific Events (4 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_bch_page_1_continue_{env}` | Page 1 completion | Lead category \= "bch" |
| `adm_bch_page_2_view_{env}` | Page 2 view | Lead category \= "bch" |
| `adm_bch_page_2_submit_{env}` | Page 2 submission | Lead category \= "bch" |
| `adm_bch_form_complete_{env}` | Form completion | Lead category \= "bch" |

### Luminaire L1 Lead Specific Events (4 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_lum_l1_page_1_continue_{env}` | Page 1 completion | Lead category \= "lum-l1" |
| `adm_lum_l1_page_2_view_{env}` | Page 2 view | Lead category \= "lum-l1" |
| `adm_lum_l1_page_2_submit_{env}` | Page 2 submission | Lead category \= "lum-l1" |
| `adm_lum_l1_form_complete_{env}` | Form completion | Lead category \= "lum-l1" |

### Luminaire L2 Lead Specific Events (4 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_lum_l2_page_1_continue_{env}` | Page 1 completion | Lead category \= "lum-l2" |
| `adm_lum_l2_page_2_view_{env}` | Page 2 view | Lead category \= "lum-l2" |
| `adm_lum_l2_page_2_submit_{env}` | Page 2 submission | Lead category \= "lum-l2" |
| `adm_lum_l2_form_complete_{env}` | Form completion | Lead category \= "lum-l2" |

### Qualified Parent Specific Events (4 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_qualfd_prnt_page_1_continue_{env}` | Page 1 completion | Parent filled \+ qualified lead |
| `adm_qualfd_prnt_page_2_view_{env}` | Page 2 view | Parent filled \+ qualified lead |
| `adm_qualfd_prnt_page_2_submit_{env}` | Page 2 submission | Parent filled \+ qualified lead |
| `adm_qualfd_prnt_form_complete_{env}` | Form completion | Parent filled \+ qualified lead |

### Qualified Student Specific Events (4 events)

| Event Name | Trigger | Conditions |
| :---- | :---- | :---- |
| `adm_qualfd_stdnt_page_1_continue_{env}` | Page 1 completion | Student filled \+ would qualify as parent |
| `adm_qualfd_stdnt_page_2_view_{env}` | Page 2 view | Student filled \+ would qualify as parent |
| `adm_qualfd_stdnt_page_2_submit_{env}` | Page 2 submission | Student filled \+ would qualify as parent |
| `adm_qualfd_stdnt_form_complete_{env}` | Form completion | Student filled \+ would qualify as parent |

## Event Firing Sequence

### Page 1 Completion Flow

1. **Primary Classification Events** fire first based on form filler type and spam detection  
2. **General Funnel Event**: `adm_page_1_continue_{env}`  
3. **Category-Specific Events**: Based on determined lead category  
4. **Qualified Parent/Student Events**: If applicable

### Page 2 Flow

1. **Page 2 View**: General \+ category-specific \+ qualified events  
2. **Page 2 Submit**: General \+ category-specific \+ qualified events  
3. **Form Complete**: General \+ category-specific \+ qualified events

## Qualification Logic

### Spam Detection

- GPA \= "10" OR percentage \= "100"

### Student Qualification Simulation

Students are evaluated as if parent filled the form using same BCH/Luminaire criteria:

- **BCH**: Grades 8-10 \+ optional/partial scholarship OR Grade 11 \+ US target  
- **Luminaire L1**: Grade 11 \+ optional scholarship \+ non-US target OR Grade 12 \+ optional scholarship  
- **Luminaire L2**: Grade 11 \+ partial scholarship \+ non-US target OR Grade 12 \+ partial scholarship

### Qualified Lead Categories

- **BCH**: `bch`  
- **Luminaire L1**: `lum-l1`  
- **Luminaire L2**: `lum-l2`

## Environment Suffix

All events automatically include environment suffix:

- Prod: `prod`  
- Staging: `stg`

Environment value comes from `VITE_ENVIRONMENT` variable.

## Event Storage

- Events are tracked in form state via `triggeredEvents` array  
- Events are included in webhook payload for database storage  
- Events are sent to both Meta Pixel and Google Analytics
