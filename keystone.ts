import { config, list } from '@keystone-6/core';
import {text, relationship, password, integer, timestamp,image} from '@keystone-6/core/fields';
import { statelessSessions } from '@keystone-6/core/session';
import {allowAll} from '@keystone-6/core/access'
import {createAuth} from '@keystone-6/auth'

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'pw',
});

export default withAuth( config({ 
    db: {
        provider: 'sqlite',
        url: 'file:./database.sqlite3',
    },
    graphql:{
        debug: process.env.NODE_ENV !== 'production',
        path: '/api/graphql',
    },
    server:{
    //   host:'ec2-13-125-129-86.ap-northeast-2.compute.amazonaws.com',
      port:3000,
    //   port:parseInt(process.env.PORT as string, 10) || 3000,
      healthCheck: {
        path:'/health',
        data: ()=>({status: '통신상태양호',timestamp:Date.now()}),
      },
      cors: {origin:['http://localhost:5500/websocket'], credentials:true}
    },
    session:statelessSessions({
      secret:"dfknqkefnikdnhdfloanfljkdabnfjanheiofaifnwiklofn",
    }),
    storage:{
      upload:{
        kind:'local',
        type:'image',
        generateUrl:path => `/upload/${path}`,
        storagePath:'upload',
        serverRoute:{
          path:'/upload',
        },
      },
    },
    lists: {
        User: list({
          fields: {
            user_id: text({validation:{isRequired:true, length:{min:5, max:15,}}, isIndexed: 'unique',label:'사용자 ID'}),
            pw : password({validation:{isRequired:true, match:{regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,explanation: '대문자, 소문자, 특수문자 필수'}},label:'패스워드'}),
            name : text({validation:{isRequired:true},label:'이름'}),
            contact : text({validation:{isRequired:true}, isIndexed: 'unique' }),
            company : text({validation:{isRequired:true}}),
            workplace : text({validation:{isRequired:true}}),
            position : text({validation:{isRequired:true}}),
            email : text({validation:{isRequired:true}, isIndexed: 'unique'}),
            nickname : text({validation:{isRequired:true,length:{min:2, max:15,}}, isIndexed: 'unique'}),
            profilepic : image({storage: 'upload'}),
          },
          access:allowAll,
        }),
        equipmentRequestInfo: list({
          fields: {            
            request_eq_date: timestamp({ defaultValue:{kind: 'now'}, validation:{isRequired:true}}),
            request_eq_state : text({validation:{isRequired:true}, defaultValue: '신청'}),
            request_eq_address : text({validation:{isRequired:true}}),
            requested_by: 
              relationship({
                ref: 'User',many:false,      
                ui:{
                  labelField:'name'
                }
              }
              ),
              request_items : relationship({ref:'EquipmentRequestItem',many:true, ui:{
                labelField:'requested_count',
              }})
          },
          access:allowAll
        }),
        Equipment: list({
          fields: {        
            equipment_name: text({validation:{isRequired:true}, label:'비품이름'}),
            equipment_description : text({validation:{isRequired:true}}),
            equipment_max_quantity : integer({validation:{isRequired:true}}),            
           
          },
          access:allowAll,
          graphql: {
            plural: 'Equipments', // 복수형 이름 지정
          },
        }),
        EquipmentRequestItem: list({
          fields: {
            equipment_item: relationship({ ref: 'Equipment', many: false, ui:{
              labelField:'equipment_name'
            },label:'비품이름'}),          
            requested_count: integer({ validation: { isRequired: true } }),
          },
          access: allowAll,
        }),
      }

})
);
